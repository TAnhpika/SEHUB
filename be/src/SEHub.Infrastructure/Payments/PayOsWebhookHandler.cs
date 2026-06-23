using Microsoft.EntityFrameworkCore;

using Microsoft.EntityFrameworkCore.Storage;

using Microsoft.Extensions.Logging;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Application.Premium;

using SEHub.Contracts.Premium;

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

    private readonly ISubscriptionService _subscriptionService;

    private readonly IPaymentConfirmationNotifier _paymentConfirmationNotifier;

    private readonly ILogger<PayOsWebhookHandler> _logger;



    public PayOsWebhookHandler(

        SEHubDbContext dbContext,

        IPayOsService payOsService,

        IPaymentAuditLogRepository auditLogRepository,

        ISubscriptionService subscriptionService,

        IPaymentConfirmationNotifier paymentConfirmationNotifier,

        ILogger<PayOsWebhookHandler> logger)

    {

        _dbContext = dbContext;

        _payOsService = payOsService;

        _auditLogRepository = auditLogRepository;

        _subscriptionService = subscriptionService;

        _paymentConfirmationNotifier = paymentConfirmationNotifier;

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



        if (root.TryGetProperty("code", out var codeElement)

            && !string.Equals(codeElement.GetString(), "00", StringComparison.Ordinal))

        {

            _logger.LogInformation("PayOS webhook ignored with code {Code}", codeElement.GetString());

            return true;

        }



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

                _logger.LogWarning(

                    "PayOS webhook order not found: {OrderCode} — treating as URL verification or unknown order",

                    orderCode);

                if (transaction is not null)

                {

                    await transaction.CommitAsync(cancellationToken);

                }



                return true;

            }



            if (order.Status == PaymentOrderStatus.Paid)

            {

                await _dbContext.PaymentAuditLogs.AddAsync(new PaymentAuditLog

                {

                    Id = Guid.NewGuid(),

                    OrderId = order.Id,

                    Action = "WEBHOOK_DUPLICATE_IGNORED",

                    PayloadJson = payload,

                    CreatedAt = DateTime.UtcNow

                }, cancellationToken);

                await _dbContext.SaveChangesAsync(cancellationToken);

                if (transaction is not null)

                {

                    await transaction.CommitAsync(cancellationToken);

                }



                return true;

            }



            var paidAt = DateTime.UtcNow;

            order.Status = PaymentOrderStatus.Paid;

            order.PaidAt = paidAt;

            order.VerifiedAt = paidAt;

            order.VerificationMethod = PaymentVerificationMethods.Webhook;

            order.UpdatedAt = paidAt;



            await _dbContext.PaymentAuditLogs.AddAsync(new PaymentAuditLog

            {

                Id = Guid.NewGuid(),

                OrderId = order.Id,

                Action = "WEBHOOK_PAID",

                PayloadJson = payload,

                CreatedAt = DateTime.UtcNow

            }, cancellationToken);



            await _dbContext.SaveChangesAsync(cancellationToken);

            if (transaction is not null)

            {

                await transaction.CommitAsync(cancellationToken);

            }



            await _subscriptionService.ActivateSubscriptionAsync(order.UserId, order.PlanId, cancellationToken);

            await DispatchPaymentNotificationAsync(order, cancellationToken);

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



    private async Task DispatchPaymentNotificationAsync(PaymentOrder order, CancellationToken cancellationToken)

    {

        try

        {

            var user = await _dbContext.Users

                .AsNoTracking()

                .FirstOrDefaultAsync(u => u.Id == order.UserId, cancellationToken);



            var subscription = await _subscriptionService.GetStatusAsync(order.UserId, cancellationToken);



            await _paymentConfirmationNotifier.NotifyPaymentConfirmedAsync(

                new PaymentPaidNotification

                {

                    UserId = order.UserId,

                    UserEmail = user?.Email ?? string.Empty,

                    DisplayName = user?.DisplayName ?? string.Empty,

                    OrderId = order.Id,

                    PayOsOrderCode = order.PayOsOrderCode,

                    PlanId = order.PlanId,

                    PlanName = order.Plan?.Name ?? string.Empty,

                    AmountVnd = order.Amount,

                    PaidAt = order.PaidAt ?? DateTime.UtcNow,

                    ExpiresAt = subscription.ExpiresAt,

                },

                cancellationToken);

        }

        catch (Exception ex)

        {

            _logger.LogWarning(

                ex,

                "Payment notification webhook dispatch failed for order {OrderId}",

                order.Id);

        }

    }

}

