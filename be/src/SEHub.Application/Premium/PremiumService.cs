using System.Text.Json;
using AutoMapper;
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
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PremiumService(
        ISubscriptionPlanRepository planRepository,
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IPayOsService payOsService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _planRepository = planRepository;
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _payOsService = payOsService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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
        var payOsOrderCode = $"{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{orderId.ToString()[..8]}";

        var payOsResult = await _payOsService.CreatePaymentLinkAsync(
            orderId,
            payOsOrderCode,
            plan.PriceVnd,
            $"SEHub Premium - {plan.Name}",
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

        return MapOrder(order, payOsResult.CheckoutUrl);
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

        return MapOrder(order, null);
    }

    public async Task<SubscriptionStatusDto> GetSubscriptionAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        return await _subscriptionService.GetStatusAsync(userId, cancellationToken);
    }

    private PaymentOrderDto MapOrder(PaymentOrder order, string? checkoutUrl) => new()
    {
        OrderId = order.Id,
        PayOsOrderCode = order.PayOsOrderCode,
        Amount = order.Amount,
        Status = order.Status.ToString(),
        QrUrl = order.QrUrl,
        CheckoutUrl = checkoutUrl,
        ExpiredAt = order.ExpiredAt
    };
}
