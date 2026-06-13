using System.Text.Json;
using FluentValidation;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Premium;

public sealed class PremiumRefundService : IPremiumRefundService
{
    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IPremiumStatusService _premiumStatusService;
    private readonly IAiTokenUsageRepository _tokenUsageRepository;
    private readonly IPaymentRefundNotificationWebhook _refundWebhook;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<PremiumRefundRequestDto> _validator;
    private readonly AiTokenLimitSettings _aiTokenLimits;

    public PremiumRefundService(
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionRepository subscriptionRepository,
        ISubscriptionService subscriptionService,
        IPremiumStatusService premiumStatusService,
        IAiTokenUsageRepository tokenUsageRepository,
        IPaymentRefundNotificationWebhook refundWebhook,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IValidator<PremiumRefundRequestDto> validator,
        IOptions<AiTokenLimitSettings> aiTokenLimits)
    {
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionRepository = subscriptionRepository;
        _subscriptionService = subscriptionService;
        _premiumStatusService = premiumStatusService;
        _tokenUsageRepository = tokenUsageRepository;
        _refundWebhook = refundWebhook;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _validator = validator;
        _aiTokenLimits = aiTokenLimits.Value;
    }

    public async Task<PremiumRefundResultDto> RequestRefundAsync(
        PremiumRefundRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var orderCode = request.OrderCode.Trim();

        var order = await _orderRepository.GetByPayOsOrderCodeAndUserIdAsync(orderCode, userId, cancellationToken)
            ?? throw new NotFoundException($"Order '{orderCode}' was not found.");

        if (order.Status == PaymentOrderStatus.RefundRequested)
        {
            throw new ConflictException("Yêu cầu hoàn tiền đang chờ admin duyệt.");
        }

        if (order.Status is PaymentOrderStatus.ProcessingRefund or PaymentOrderStatus.Refunded)
        {
            throw new ConflictException("Đơn hàng đã được xử lý hoàn tiền.");
        }

        if (order.Status != PaymentOrderStatus.Paid)
        {
            throw new DomainException("Chỉ có thể hoàn tiền đơn hàng đã thanh toán thành công.");
        }

        var paidAt = await GetPaymentCompletedAtUtcAsync(order, cancellationToken);
        EnsureWithinRefundWindow(paidAt);

        order.Status = PaymentOrderStatus.RefundRequested;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Action = "REFUND_REQUEST",
            ActorId = userId,
            PayloadJson = JsonSerializer.Serialize(new
            {
                request.Reason,
                orderCode,
                paidAt,
            }),
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var subscription = await _subscriptionService.GetStatusAsync(userId, cancellationToken);

        return new PremiumRefundResultDto
        {
            OrderCode = orderCode,
            Status = order.Status.ToString(),
            IsPremium = subscription.IsActive,
            AiDailyTokenLimit = subscription.IsActive
                ? _aiTokenLimits.DailyTokenLimitPremium
                : _aiTokenLimits.DailyTokenLimitFree,
            Message = "Yêu cầu hoàn tiền đã được gửi. Admin sẽ duyệt trong thời gian sớm nhất — gói Premium vẫn hoạt động cho đến khi được chấp thuận.",
        };
    }

    public async Task<PremiumRefundResultDto> ApproveRefundAsync(
        Guid orderId,
        string? adminNote,
        CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", orderId);

        if (order.Status == PaymentOrderStatus.ProcessingRefund || order.Status == PaymentOrderStatus.Refunded)
        {
            throw new ConflictException("Đơn hàng đã được duyệt hoàn tiền.");
        }

        if (order.Status != PaymentOrderStatus.RefundRequested)
        {
            throw new DomainException("Đơn hàng chưa có yêu cầu hoàn tiền từ sinh viên.");
        }

        var paidAt = await GetPaymentCompletedAtUtcAsync(order, cancellationToken);
        EnsureWithinRefundWindow(paidAt);

        order.Status = PaymentOrderStatus.ProcessingRefund;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Action = "REFUND_APPROVED",
            ActorId = actorId,
            PayloadJson = JsonSerializer.Serialize(new
            {
                adminNote,
                orderCode = order.PayOsOrderCode,
                paidAt,
            }),
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _subscriptionRepository.DeactivateAllForUserAsync(order.UserId, cancellationToken);
        await AdjustAiTokensAfterRefundAsync(order.UserId, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _premiumStatusService.InvalidateCache(order.UserId);

        await _refundWebhook.NotifyRefundRequestedAsync(
            new PremiumRefundNotification { OrderCode = order.PayOsOrderCode },
            cancellationToken);

        var subscription = await _subscriptionService.GetStatusAsync(order.UserId, cancellationToken);

        return new PremiumRefundResultDto
        {
            OrderCode = order.PayOsOrderCode,
            Status = order.Status.ToString(),
            IsPremium = subscription.IsActive,
            AiDailyTokenLimit = subscription.IsActive
                ? _aiTokenLimits.DailyTokenLimitPremium
                : _aiTokenLimits.DailyTokenLimitFree,
            Message = "Đã duyệt hoàn tiền. Gói Premium đã bị hủy và lệnh hoàn tiền đã được gửi xử lý.",
        };
    }

    private async Task<DateTime> GetPaymentCompletedAtUtcAsync(
        PaymentOrder order,
        CancellationToken cancellationToken)
    {
        return await _auditLogRepository.GetPaymentCompletedAtUtcAsync(order.Id, cancellationToken)
            ?? order.UpdatedAt
            ?? order.CreatedAt;
    }

    private static void EnsureWithinRefundWindow(DateTime paidAt)
    {
        if ((DateTime.UtcNow - paidAt).TotalHours > 24)
        {
            throw new DomainException("Đã quá hạn 24 giờ kể từ lúc thanh toán, không thể hoàn tiền.");
        }
    }

    private async Task AdjustAiTokensAfterRefundAsync(Guid userId, CancellationToken cancellationToken)
    {
        var premiumBonus = _aiTokenLimits.DailyTokenLimitPremium - _aiTokenLimits.DailyTokenLimitFree;
        if (premiumBonus <= 0)
        {
            return;
        }

        var usage = await _tokenUsageRepository.GetTodayUsageAsync(userId, cancellationToken);
        if (usage is null)
        {
            return;
        }

        usage.TokensConsumed = Math.Max(0, usage.TokensConsumed - premiumBonus);
        usage.UpdatedAt = DateTime.UtcNow;
        await _tokenUsageRepository.UpdateAsync(usage, cancellationToken);
    }
}
