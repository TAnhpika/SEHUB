using System.Text.Json;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Premium;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public sealed class AdminPaymentService : IAdminPaymentService
{
    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IUserRepository _userRepository;
    private readonly IPaymentConfirmationNotifier _paymentConfirmationNotifier;
    private readonly IPremiumRefundService _premiumRefundService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public AdminPaymentService(
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IUserRepository userRepository,
        IPaymentConfirmationNotifier paymentConfirmationNotifier,
        IPremiumRefundService premiumRefundService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _userRepository = userRepository;
        _paymentConfirmationNotifier = paymentConfirmationNotifier;
        _premiumRefundService = premiumRefundService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<PaymentListItemDto>> GetPaymentsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _orderRepository.GetPagedAsync(page, pageSize, cancellationToken);
        var dtos = new List<PaymentListItemDto>();

        foreach (var order in items)
        {
            dtos.Add(await MapPaymentAsync(order, cancellationToken));
        }

        return new PagedResult<PaymentListItemDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PaymentListItemDto> GetPaymentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", id);

        return await MapPaymentAsync(order, cancellationToken);
    }

    public async Task ConfirmPaymentAsync(Guid orderId, ConfirmPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", orderId);

        if (order.Status == PaymentOrderStatus.Paid)
        {
            return;
        }

        if (order.Status != PaymentOrderStatus.WaitingConfirmation)
        {
            throw new ConflictException("Chỉ xác nhận đơn ở trạng thái WaitingConfirmation.");
        }

        var now = DateTime.UtcNow;
        order.Status = PaymentOrderStatus.Paid;
        order.PaidAt = now;
        order.VerifiedAt = now;
        order.VerificationMethod = PaymentVerificationMethods.ManualVerification;
        order.UpdatedAt = now;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Action = "ManualVerification",
            ActorId = actorId,
            PayloadJson = JsonSerializer.Serialize(new { request.Note }),
            CreatedAt = now
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _subscriptionService.ActivateSubscriptionAsync(order.UserId, order.PlanId, cancellationToken);

        var user = await _userRepository.GetByIdAsync(order.UserId, cancellationToken);
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
                PlanName = subscription.PlanName ?? order.Plan?.Name ?? string.Empty,
                AmountVnd = order.Amount,
                PaidAt = order.PaidAt ?? now,
                ExpiresAt = subscription.ExpiresAt,
            },
            cancellationToken);
    }

    public Task<PremiumRefundResultDto> ApproveRefundAsync(
        Guid orderId,
        ApproveRefundRequest request,
        CancellationToken cancellationToken = default) =>
        _premiumRefundService.ApproveRefundAsync(orderId, request.Note, cancellationToken);

    public async Task<PagedResult<PaymentAuditLogDto>> GetAuditLogsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _auditLogRepository.GetPagedAsync(page, pageSize, cancellationToken);

        return new PagedResult<PaymentAuditLogDto>
        {
            Items = items.Select(l => new PaymentAuditLogDto
            {
                Id = l.Id,
                OrderId = l.OrderId,
                Action = l.Action,
                ActorId = l.ActorId,
                PayloadJson = l.PayloadJson,
                CreatedAt = l.CreatedAt
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    private async Task<PaymentListItemDto> MapPaymentAsync(PaymentOrder order, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(order.UserId, cancellationToken);
        var auditLogs = await _auditLogRepository.GetByOrderIdAsync(order.Id, cancellationToken);
        var paidAt = order.PaidAt
            ?? auditLogs
                .Where(l => l.Action is "WEBHOOK_PAID" or "N8N_ACTIVATE" or "ADMIN_CONFIRM" or "ManualVerification")
                .OrderBy(l => l.CreatedAt)
                .Select(l => (DateTime?)l.CreatedAt)
                .FirstOrDefault()
            ?? order.UpdatedAt
            ?? order.CreatedAt;

        var refundRequest = auditLogs
            .Where(l => l.Action == "REFUND_REQUEST")
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefault();

        string? refundReason = null;
        if (refundRequest is not null)
        {
            try
            {
                using var document = JsonDocument.Parse(refundRequest.PayloadJson);
                if (document.RootElement.TryGetProperty("Reason", out var reasonElement)
                    || document.RootElement.TryGetProperty("reason", out reasonElement))
                {
                    refundReason = reasonElement.GetString();
                }
            }
            catch
            {
                refundReason = refundRequest.PayloadJson;
            }
        }

        return new PaymentListItemDto
        {
            Id = order.Id,
            UserId = order.UserId,
            Username = user?.Username ?? "unknown",
            UserEmail = user?.Email,
            PayOsOrderCode = order.PayOsOrderCode,
            Amount = order.Amount,
            Status = order.Status.ToString(),
            PlanName = order.Plan?.Name,
            PlanCode = order.Plan?.Code,
            CreatedAt = order.CreatedAt,
            PaidAt = order.Status is PaymentOrderStatus.Paid
                or PaymentOrderStatus.RefundRequested
                or PaymentOrderStatus.ProcessingRefund
                or PaymentOrderStatus.Refunded
                ? paidAt
                : null,
            RefundRequestReason = refundReason,
            RefundRequestedAt = refundRequest?.CreatedAt,
        };
    }
}
