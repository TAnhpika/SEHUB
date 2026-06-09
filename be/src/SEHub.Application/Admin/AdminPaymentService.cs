using System.Text.Json;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Premium;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
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
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public AdminPaymentService(
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _userRepository = userRepository;
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

        order.Status = PaymentOrderStatus.Paid;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepository.UpdateAsync(order, cancellationToken);

        await _auditLogRepository.AddAsync(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Action = "ADMIN_CONFIRM",
            ActorId = actorId,
            PayloadJson = JsonSerializer.Serialize(new { request.Note }),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _subscriptionService.ActivateSubscriptionAsync(order.UserId, order.PlanId, cancellationToken);
    }

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

        return new PaymentListItemDto
        {
            Id = order.Id,
            UserId = order.UserId,
            Username = user?.Username ?? "unknown",
            PayOsOrderCode = order.PayOsOrderCode,
            Amount = order.Amount,
            Status = order.Status.ToString(),
            PlanName = order.Plan?.Name,
            CreatedAt = order.CreatedAt,
            PaidAt = order.Status == PaymentOrderStatus.Paid ? order.UpdatedAt : null
        };
    }
}
