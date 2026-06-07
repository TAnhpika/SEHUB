using Microsoft.EntityFrameworkCore;

using Microsoft.EntityFrameworkCore.Storage;

using Microsoft.Extensions.Logging;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Domain.Entities;

using SEHub.Domain.Enums;

using SEHub.Infrastructure.Persistence;

using System.Text.Json;



namespace SEHub.Infrastructure.Payments;



public class PayOsWebhookHandler : IPayOsWebhookHandler

{

    private readonly SEHubDbContext _dbContext;

    private readonly IPayOsService _payOsService;

    private readonly IPaymentAuditLogRepository _auditLogRepository;

    private readonly IPremiumStatusService _premiumStatusService;

    private readonly IUnitOfWork _unitOfWork;

    private readonly ILogger<PayOsWebhookHandler> _logger;



    public PayOsWebhookHandler(

        SEHubDbContext dbContext,

        IPayOsService payOsService,

        IPaymentAuditLogRepository auditLogRepository,

        IPremiumStatusService premiumStatusService,

        IUnitOfWork unitOfWork,

        ILogger<PayOsWebhookHandler> logger)

    {

        _dbContext = dbContext;

        _payOsService = payOsService;

        _auditLogRepository = auditLogRepository;

        _premiumStatusService = premiumStatusService;

        _unitOfWork = unitOfWork;

        _logger = logger;

    }



    public async Task<bool> HandleAsync(string payload, string signature, CancellationToken cancellationToken = default)

    {

        if (!_payOsService.VerifyWebhookSignature(payload, signature))

        {

            _logger.LogWarning("PayOS webhook signature verification failed");

            return false;

        }



        using var document = JsonDocument.Parse(payload);

        var root = document.RootElement;



        if (!root.TryGetProperty("data", out var data)

            || !data.TryGetProperty("orderCode", out var orderCodeElement))

        {

            _logger.LogWarning("PayOS webhook missing orderCode");

            return false;

        }



        var orderCode = orderCodeElement.ToString();

        if (string.IsNullOrWhiteSpace(orderCode))

        {

            return false;

        }



        var reference = data.TryGetProperty("reference", out var referenceElement)

            ? referenceElement.GetString()

            : orderCode;



        if (!string.IsNullOrWhiteSpace(reference)

            && await _auditLogRepository.ExistsByExternalReferenceAsync(reference, cancellationToken))

        {

            return true;

        }



        var useTransaction = _dbContext.Database.IsRelational();

        IDbContextTransaction? transaction = null;

        if (useTransaction)

        {

            transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        }



        try

        {

            var order = await _dbContext.PaymentOrders

                .Include(o => o.Plan)

                .FirstOrDefaultAsync(o => o.PayOsOrderCode == orderCode, cancellationToken);



            if (order is null)

            {

                _logger.LogWarning("PayOS webhook order not found: {OrderCode}", orderCode);

                return false;

            }



            if (order.Status == PaymentOrderStatus.Paid)

            {

                if (transaction is not null)

                {

                    await transaction.CommitAsync(cancellationToken);

                }



                return true;

            }



            order.Status = PaymentOrderStatus.Paid;

            order.UpdatedAt = DateTime.UtcNow;



            var existingActive = await _dbContext.Subscriptions

                .Where(s => s.UserId == order.UserId && s.IsActive && s.EndAt > DateTime.UtcNow)

                .ToListAsync(cancellationToken);



            foreach (var sub in existingActive)

            {

                sub.IsActive = false;

                sub.UpdatedAt = DateTime.UtcNow;

            }



            var startAt = DateTime.UtcNow;

            await _dbContext.Subscriptions.AddAsync(new Subscription

            {

                Id = Guid.NewGuid(),

                UserId = order.UserId,

                PlanId = order.PlanId,

                StartAt = startAt,

                EndAt = startAt.AddDays(order.Plan.DurationDays),

                IsActive = true,

                CreatedAt = startAt

            }, cancellationToken);



            await _dbContext.PaymentAuditLogs.AddAsync(new PaymentAuditLog

            {

                Id = Guid.NewGuid(),

                OrderId = order.Id,

                Action = "WEBHOOK_PAID",

                PayloadJson = payload,

                CreatedAt = DateTime.UtcNow

            }, cancellationToken);



            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (transaction is not null)

            {

                await transaction.CommitAsync(cancellationToken);

            }



            _premiumStatusService.InvalidateCache(order.UserId);

            _logger.LogInformation("PayOS webhook processed for order {OrderCode}", orderCode);

            return true;

        }

        finally

        {

            if (transaction is not null)

            {

                await transaction.DisposeAsync();

            }

        }

    }

}

