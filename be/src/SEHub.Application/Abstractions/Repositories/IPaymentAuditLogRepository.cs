using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPaymentAuditLogRepository
{
    Task AddAsync(PaymentAuditLog log, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentAuditLog>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<DateTime?> GetPaymentCompletedAtUtcAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PaymentAuditLog> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PaymentAuditLog> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<bool> ExistsByExternalReferenceAsync(string reference, CancellationToken cancellationToken = default);
}
