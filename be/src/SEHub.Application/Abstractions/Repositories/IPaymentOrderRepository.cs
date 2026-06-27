using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPaymentOrderRepository
{
    Task<PaymentOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaymentOrder?> GetByPayOsOrderCodeAsync(string payOsOrderCode, CancellationToken cancellationToken = default);
    Task<PaymentOrder?> GetByPayOsOrderCodeAndUserIdAsync(
        string payOsOrderCode,
        Guid userId,
        CancellationToken cancellationToken = default);
    Task<PaymentOrder?> GetLatestPaidByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PaymentOrder> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentOrder>> GetStaleWaitingConfirmationAsync(DateTime waitingSinceBeforeUtc, CancellationToken cancellationToken = default);
    Task AddAsync(PaymentOrder order, CancellationToken cancellationToken = default);
    Task UpdateAsync(PaymentOrder order, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<(DateOnly Date, decimal Amount)>> GetPaidRevenueByDateRangeAsync(
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default);
}
