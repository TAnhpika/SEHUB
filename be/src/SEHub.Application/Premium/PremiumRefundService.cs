using System.Text.Json;
using FluentValidation;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Application.Notifications;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Premium;

public sealed class PremiumRefundService : IPremiumRefundService
{
    private const int MaxPaymentProofFiles = 5;
    private const long MaxPaymentProofFileSizeBytes = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedPaymentProofContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    };

    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IPremiumStatusService _premiumStatusService;
    private readonly IAiTokenUsageRepository _tokenUsageRepository;
    private readonly IPaymentRefundNotificationWebhook _refundWebhook;
    private readonly INotificationService _notificationService;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly IFileStorageService _fileStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<PremiumRefundRequestDto> _validator;
    private readonly IValidator<PremiumRefundBankDetailsRequest> _bankDetailsValidator;
    private readonly AiTokenLimitSettings _aiTokenLimits;

    public PremiumRefundService(
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IPremiumStatusService premiumStatusService,
        IAiTokenUsageRepository tokenUsageRepository,
        IPaymentRefundNotificationWebhook refundWebhook,
        INotificationService notificationService,
        IWorkflowNotificationService workflowNotifications,
        IFileStorageService fileStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IValidator<PremiumRefundRequestDto> validator,
        IValidator<PremiumRefundBankDetailsRequest> bankDetailsValidator,
        IOptions<AiTokenLimitSettings> aiTokenLimits)
    {
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _premiumStatusService = premiumStatusService;
        _tokenUsageRepository = tokenUsageRepository;
        _refundWebhook = refundWebhook;
        _notificationService = notificationService;
        _workflowNotifications = workflowNotifications;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _validator = validator;
        _bankDetailsValidator = bankDetailsValidator;
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

        await _workflowNotifications.NotifyAdminsRefundRequestedAsync(
            order,
            userId,
            request.Reason,
            cancellationToken);

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
                durationDaysRevoked = order.Plan?.DurationDays,
            }),
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        var durationDays = order.Plan?.DurationDays
            ?? throw new DomainException("Không xác định được thời hạn gói để hoàn tiền.");

        var isStillPremium = await _subscriptionService.RevokePlanDurationForRefundAsync(
            order.UserId,
            durationDays,
            cancellationToken);

        if (!isStillPremium)
        {
            await AdjustAiTokensAfterRefundAsync(order.UserId, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _premiumStatusService.InvalidateCache(order.UserId);

        await _refundWebhook.NotifyRefundRequestedAsync(
            new PremiumRefundNotification { OrderCode = order.PayOsOrderCode },
            cancellationToken);

        await _notificationService.CreateAsync(
            order.UserId,
            NotificationType.Refund,
            "Yêu cầu hoàn tiền đã được duyệt",
            $"Admin đã chấp thuận hoàn tiền đơn {order.PayOsOrderCode}. Vui lòng điền thông tin tài khoản nhận tiền.",
            $"/home/premium/refund-form?order={Uri.EscapeDataString(order.PayOsOrderCode)}",
            actorId,
            order.Id,
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
            Message = isStillPremium
                ? $"Đã duyệt hoàn tiền. Đã trừ {durationDays} ngày Premium từ gói vừa mua. Gói vẫn còn hiệu lực."
                : "Đã duyệt hoàn tiền. Gói Premium đã bị hủy và lệnh hoàn tiền đã được gửi xử lý.",
        };
    }

    public async Task<PremiumRefundFormDto> GetRefundFormAsync(
        string orderCode,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await GetRefundEligibleOrderAsync(orderCode.Trim(), userId, cancellationToken);
        var auditLogs = await _auditLogRepository.GetByOrderIdAsync(order.Id, cancellationToken);
        var bankDetailsSubmitted = auditLogs.Any(log => log.Action == "REFUND_BANK_DETAILS");

        return new PremiumRefundFormDto
        {
            OrderCode = order.PayOsOrderCode,
            Status = order.Status.ToString(),
            PlanName = order.Plan?.Name,
            Amount = order.Amount,
            BankDetailsSubmitted = bankDetailsSubmitted,
            Message = bankDetailsSubmitted
                ? "Thông tin nhận tiền đã được gửi. SEHub sẽ xử lý hoàn tiền trong thời gian sớm nhất."
                : "Vui lòng điền thông tin tài khoản ngân hàng để nhận hoàn tiền.",
        };
    }

    public async Task<PremiumRefundResultDto> SubmitRefundBankDetailsAsync(
        PremiumRefundBankDetailsRequest request,
        IReadOnlyList<RefundPaymentProofUpload> paymentProofs,
        CancellationToken cancellationToken = default)
    {
        await _bankDetailsValidator.ValidateAndThrowAsync(request, cancellationToken);
        ValidatePaymentProofs(paymentProofs);

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var orderCode = request.OrderCode.Trim();
        var order = await GetRefundEligibleOrderAsync(orderCode, userId, cancellationToken);

        var auditLogs = await _auditLogRepository.GetByOrderIdAsync(order.Id, cancellationToken);
        if (auditLogs.Any(log => log.Action == "REFUND_BANK_DETAILS"))
        {
            throw new ConflictException("Thông tin nhận tiền đã được gửi trước đó.");
        }

        var paymentProofPaths = new List<string>();
        foreach (var proof in paymentProofs)
        {
            var storedPath = await _fileStorage.UploadAsync(
                proof.Content,
                proof.FileName,
                proof.ContentType,
                "premium-refunds",
                cancellationToken);
            paymentProofPaths.Add(storedPath);
        }

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Action = "REFUND_BANK_DETAILS",
            ActorId = userId,
            PayloadJson = JsonSerializer.Serialize(new
            {
                request.Username,
                request.BankName,
                request.AccountNumber,
                request.AccountName,
                request.Note,
                orderCode,
                paymentProofPaths,
            }),
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _workflowNotifications.NotifyAdminsRefundBankDetailsSubmittedAsync(
            order,
            userId,
            cancellationToken);

        var subscription = await _subscriptionService.GetStatusAsync(userId, cancellationToken);

        return new PremiumRefundResultDto
        {
            OrderCode = orderCode,
            Status = order.Status.ToString(),
            IsPremium = subscription.IsActive,
            AiDailyTokenLimit = subscription.IsActive
                ? _aiTokenLimits.DailyTokenLimitPremium
                : _aiTokenLimits.DailyTokenLimitFree,
            Message = "Đã gửi thông tin nhận tiền. SEHub sẽ xử lý hoàn tiền trong thời gian sớm nhất.",
        };
    }

    public async Task<PremiumRefundResultDto> CompleteRefundAsync(
        Guid orderId,
        string? adminNote,
        CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", orderId);

        if (order.Status == PaymentOrderStatus.Refunded)
        {
            throw new ConflictException("Đơn hàng đã được đánh dấu hoàn tiền.");
        }

        if (order.Status != PaymentOrderStatus.ProcessingRefund)
        {
            throw new DomainException("Chỉ có thể hoàn tất đơn đang xử lý hoàn tiền.");
        }

        order.Status = PaymentOrderStatus.Refunded;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Action = "REFUND_COMPLETED",
            ActorId = actorId,
            PayloadJson = JsonSerializer.Serialize(new
            {
                adminNote,
                orderCode = order.PayOsOrderCode,
            }),
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _workflowNotifications.NotifyUserRefundCompletedAsync(
            order,
            actorId,
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
            Message = "Đã xác nhận hoàn tiền thành công cho sinh viên.",
        };
    }

    private async Task<PaymentOrder> GetRefundEligibleOrderAsync(
        string orderCode,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByPayOsOrderCodeAndUserIdAsync(orderCode, userId, cancellationToken)
            ?? throw new NotFoundException($"Order '{orderCode}' was not found.");

        if (order.Status is not (PaymentOrderStatus.ProcessingRefund or PaymentOrderStatus.Refunded))
        {
            throw new DomainException("Đơn hàng chưa được duyệt hoàn tiền hoặc không còn yêu cầu nhận tiền.");
        }

        return order;
    }

    private static void ValidatePaymentProofs(IReadOnlyList<RefundPaymentProofUpload> paymentProofs)
    {
        if (paymentProofs is null || paymentProofs.Count == 0)
        {
            throw new DomainException("Vui lòng tải ít nhất một ảnh đã chuyển khoản.");
        }

        if (paymentProofs.Count > MaxPaymentProofFiles)
        {
            throw new DomainException($"Chỉ được tải tối đa {MaxPaymentProofFiles} ảnh.");
        }

        foreach (var proof in paymentProofs)
        {
            if (proof.SizeBytes <= 0)
            {
                throw new DomainException("Ảnh chuyển khoản không hợp lệ.");
            }

            if (proof.SizeBytes > MaxPaymentProofFileSizeBytes)
            {
                throw new DomainException("Mỗi ảnh chuyển khoản không được vượt quá 10 MB.");
            }

            var contentType = proof.ContentType?.Trim() ?? string.Empty;
            if (!AllowedPaymentProofContentTypes.Contains(contentType))
            {
                throw new DomainException("Ảnh chuyển khoản phải là JPEG, PNG, WEBP hoặc GIF.");
            }

            var fileName = Path.GetFileName(proof.FileName);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new DomainException("Tên tệp ảnh không hợp lệ.");
            }
        }
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
