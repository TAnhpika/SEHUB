using System.Text.Json;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Premium;

public sealed class PremiumService : IPremiumService
{
    private readonly ISubscriptionPlanRepository _planRepository;
    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IPayOsService _payOsService;
    private readonly IPayOsWebhookHandler _payOsWebhookHandler;
    private readonly ICurrentUserService _currentUser;
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IHostEnvironment _environment;

    public PremiumService(
        ISubscriptionPlanRepository planRepository,
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IPayOsService payOsService,
        IPayOsWebhookHandler payOsWebhookHandler,
        ICurrentUserService currentUser,
        IConfiguration configuration,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHostEnvironment environment)
    {
        _planRepository = planRepository;
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _payOsService = payOsService;
        _payOsWebhookHandler = payOsWebhookHandler;
        _currentUser = currentUser;
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _environment = environment;
    }

    public async Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _planRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IReadOnlyList<SubscriptionPlanDto>>(plans);
    }

    public async Task<PaymentOrderDto> CreateOrderAsync(CreatePaymentOrderRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var plan = await _planRepository.GetByCodeAsync(request.PlanCode, cancellationToken)
            ?? throw new NotFoundException($"Plan '{request.PlanCode}' was not found.");

        var orderId = Guid.NewGuid();
        var payOsOrderCode = GeneratePayOsOrderCode();
        var checkoutUrls = BuildCheckoutUrls(orderId, plan.Code);

        var payOsResult = await _payOsService.CreatePaymentLinkAsync(
            orderId,
            payOsOrderCode,
            plan.PriceVnd,
            $"SEHub Premium - {plan.Name}",
            checkoutUrls,
            cancellationToken);

        var order = new PaymentOrder
        {
            Id = orderId,
            UserId = userId,
            PlanId = plan.Id,
            PayOsOrderCode = payOsOrderCode,
            Amount = plan.PriceVnd,
            Status = PaymentOrderStatus.Pending,
            QrUrl = payOsResult.QrUrl,
            ExpiredAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow
        };

        await _orderRepository.AddAsync(order, cancellationToken);
        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Action = "ORDER_CREATED",
            ActorId = userId,
            PayloadJson = JsonSerializer.Serialize(new { request.PlanCode }),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapOrder(order, payOsResult.CheckoutUrl, plan.Code);
    }

    public async Task<PaymentOrderDto> GetOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", orderId);

        if (order.UserId != userId && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("You do not have access to this order.");
        }

        return MapOrder(order, null, order.Plan?.Code);
    }

    public async Task<SubscriptionStatusDto> GetSubscriptionAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var status = await _subscriptionService.GetStatusAsync(userId, cancellationToken);

        if (!status.IsActive)
        {
            return status;
        }

        var latestPaidOrder = await _orderRepository.GetLatestPaidByUserIdAsync(userId, cancellationToken);
        if (latestPaidOrder is null)
        {
            return status;
        }

        var paidAt = await _auditLogRepository.GetPaymentCompletedAtUtcAsync(latestPaidOrder.Id, cancellationToken)
            ?? latestPaidOrder.UpdatedAt
            ?? latestPaidOrder.CreatedAt;

        var canRequestRefund = latestPaidOrder.Status == PaymentOrderStatus.Paid
            && (DateTime.UtcNow - paidAt).TotalHours <= 24;

        return new SubscriptionStatusDto
        {
            IsActive = status.IsActive,
            ExpiresAt = status.ExpiresAt,
            PlanName = status.PlanName,
            LatestPaidOrderCode = latestPaidOrder.PayOsOrderCode,
            LastPaidAt = paidAt,
            CanRequestRefund = canRequestRefund,
            HasPendingRefundRequest = latestPaidOrder.Status == PaymentOrderStatus.RefundRequested,
        };
    }

    public async Task<PaymentOrderDto> ConfirmDevPaymentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        if (!_environment.IsDevelopment())
        {
            throw new NotFoundException("PaymentOrder", orderId);
        }

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException("PaymentOrder", orderId);

        if (order.UserId != userId)
        {
            throw new ForbiddenException("You do not have access to this order.");
        }

        if (order.Status == PaymentOrderStatus.Paid)
        {
            return MapOrder(order, null, order.Plan?.Code);
        }

        if (!long.TryParse(order.PayOsOrderCode, out var orderCodeNumeric))
        {
            throw new InvalidOperationException("PayOsOrderCode must be numeric for webhook simulation.");
        }

        var reference = $"dev-confirm-{orderId:N}";
        var payload = JsonSerializer.Serialize(new
        {
            code = "00",
            desc = "success",
            data = new
            {
                orderCode = orderCodeNumeric,
                amount = order.Amount,
                description = "SEHub Premium (dev confirm)",
                reference
            },
            signature = "mock-mock-checksum-key-dev"
        });

        var handled = await _payOsWebhookHandler.HandleAsync(payload, "mock-mock-checksum-key-dev", cancellationToken);
        if (!handled)
        {
            throw new InvalidOperationException("Dev payment confirmation failed.");
        }

        return await GetOrderAsync(orderId, cancellationToken);
    }

    private PaymentOrderDto MapOrder(PaymentOrder order, string? checkoutUrl, string? planCode) => new()
    {
        OrderId = order.Id,
        PayOsOrderCode = order.PayOsOrderCode,
        Amount = order.Amount,
        Status = order.Status.ToString(),
        QrUrl = order.QrUrl,
        CheckoutUrl = checkoutUrl,
        ExpiredAt = order.ExpiredAt,
        PlanCode = planCode
    };

    private PayOsCheckoutUrls BuildCheckoutUrls(Guid orderId, string planCode)
    {
        var frontendBase = _configuration["PayOS:FrontendBaseUrl"]
            ?? _configuration["Frontend:BaseUrl"]
            ?? _configuration["Cors:AllowedOrigins:0"]
            ?? "http://localhost:5173";
        frontendBase = frontendBase.TrimEnd('/');
        var fePlanId = MapPlanCodeToFePlanId(planCode);

        return new PayOsCheckoutUrls
        {
            ReturnUrl = $"{frontendBase}/home/premium/success/{fePlanId}?orderId={orderId:D}",
            CancelUrl = $"{frontendBase}/home/premium/checkout/{fePlanId}",
        };
    }

    private static string MapPlanCodeToFePlanId(string planCode) => planCode.ToLowerInvariant() switch
    {
        "1m" => "trial",
        "8m" => "semester",
        "4y" => "full",
        _ => "trial",
    };

    private static string GeneratePayOsOrderCode()
    {
        var unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var candidate = (int)(unix % 2_000_000_000L) * 10 + Random.Shared.Next(0, 10);
        return candidate.ToString();
    }
}
