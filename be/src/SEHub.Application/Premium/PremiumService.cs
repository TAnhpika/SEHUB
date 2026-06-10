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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public PremiumService(
        ISubscriptionPlanRepository planRepository,
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IPayOsService payOsService,
        IPayOsWebhookHandler payOsWebhookHandler,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        _planRepository = planRepository;
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _payOsService = payOsService;
        _payOsWebhookHandler = payOsWebhookHandler;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _environment = environment;
        _configuration = configuration;
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
        var (returnUrl, cancelUrl) = BuildPayOsRedirectUrls(orderId);

        var payOsResult = await _payOsService.CreatePaymentLinkAsync(
            orderId,
            payOsOrderCode,
            plan.PriceVnd,
            $"SEHub Premium - {plan.Name}",
            returnUrl,
            cancelUrl,
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
        return await _subscriptionService.GetStatusAsync(userId, cancellationToken);
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

    private (string ReturnUrl, string CancelUrl) BuildPayOsRedirectUrls(Guid orderId)
    {
        var frontendBase = (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
        var returnTemplate = _configuration["PayOS:ReturnUrl"]
            ?? $"{frontendBase}/home/premium/payment-return?orderId={{orderId}}";
        var cancelUrl = _configuration["PayOS:CancelUrl"]
            ?? $"{frontendBase}/home/premium?cancelled=1";

        var returnUrl = returnTemplate.Replace("{orderId}", orderId.ToString(), StringComparison.Ordinal);
        return (returnUrl, cancelUrl);
    }

    private static string GeneratePayOsOrderCode()
    {
        var unix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var candidate = (int)(unix % 2_000_000_000L) * 10 + Random.Shared.Next(0, 10);
        return candidate.ToString();
    }
}
