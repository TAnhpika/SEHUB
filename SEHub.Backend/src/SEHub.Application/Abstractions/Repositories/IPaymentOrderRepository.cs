using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPaymentOrderRepository
{
    Task<PaymentOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaymentOrder?> GetByPayOsOrderCodeAsync(string payOsOrderCode, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PaymentOrder> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task AddAsync(PaymentOrder order, CancellationToken cancellationToken = default);
    Task UpdateAsync(PaymentOrder order, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default);
}
