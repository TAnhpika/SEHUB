using System.Text.Json;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Premium;

public sealed class PaymentOrderMaintenanceService : IPaymentOrderMaintenanceService
{
    public const int WaitingConfirmationExpiryHours = 24;

    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PaymentOrderMaintenanceService(
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        IUnitOfWork unitOfWork)
    {
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task ExpireWaitingConfirmationOrdersAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddHours(-WaitingConfirmationExpiryHours);
        var staleOrders = await _orderRepository.GetStaleWaitingConfirmationAsync(cutoff, cancellationToken);

        if (staleOrders.Count == 0)
        {
            return;
        }

        foreach (var order in staleOrders)
        {
            order.Status = PaymentOrderStatus.Expired;
            order.UpdatedAt = DateTime.UtcNow;

            await _auditLogRepository.AddAsync(new PaymentAuditLog
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Action = "PAYMENT_EXPIRED",
                PayloadJson = JsonSerializer.Serialize(new
                {
                    reason = "WaitingConfirmation exceeded 24 hours",
                    order.WaitingConfirmationAt
                }),
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
