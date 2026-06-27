using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PaymentOrderRepository : IPaymentOrderRepository
{
    private readonly SEHubDbContext _context;

    public PaymentOrderRepository(SEHubDbContext context) => _context = context;

    public Task<PaymentOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PaymentOrders
            .Include(o => o.Plan)
            .Include(o => o.AuditLogs)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public Task<PaymentOrder?> GetByPayOsOrderCodeAsync(string payOsOrderCode, CancellationToken cancellationToken = default) =>
        _context.PaymentOrders
            .Include(o => o.Plan)
            .FirstOrDefaultAsync(o => o.PayOsOrderCode == payOsOrderCode, cancellationToken);

    public Task<PaymentOrder?> GetByPayOsOrderCodeAndUserIdAsync(
        string payOsOrderCode,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.PaymentOrders
            .Include(o => o.Plan)
            .FirstOrDefaultAsync(
                o => o.PayOsOrderCode == payOsOrderCode && o.UserId == userId,
                cancellationToken);

    public Task<PaymentOrder?> GetLatestPaidByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.PaymentOrders
            .Where(o => o.UserId == userId && (
                o.Status == PaymentOrderStatus.Paid
                || o.Status == PaymentOrderStatus.RefundRequested
                || o.Status == PaymentOrderStatus.ProcessingRefund))
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(IReadOnlyList<PaymentOrder> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.PaymentOrders.Include(o => o.Plan);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<PaymentOrder>> GetStaleWaitingConfirmationAsync(
        DateTime waitingSinceBeforeUtc,
        CancellationToken cancellationToken = default) =>
        await _context.PaymentOrders
            .Where(o =>
                o.Status == PaymentOrderStatus.WaitingConfirmation
                && o.WaitingConfirmationAt != null
                && o.WaitingConfirmationAt <= waitingSinceBeforeUtc)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(PaymentOrder order, CancellationToken cancellationToken = default) =>
        await _context.PaymentOrders.AddAsync(order, cancellationToken);

    public Task UpdateAsync(PaymentOrder order, CancellationToken cancellationToken = default)
    {
        _context.PaymentOrders.Update(order);
        return Task.CompletedTask;
    }

    public Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default) =>
        _context.PaymentOrders
            .Where(o => o.Status == PaymentOrderStatus.Paid)
            .SumAsync(o => o.Amount, cancellationToken);

    public async Task<IReadOnlyList<(DateOnly Date, decimal Amount)>> GetPaidRevenueByDateRangeAsync(
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = endDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var rows = await _context.PaymentOrders
            .AsNoTracking()
            .Where(o =>
                o.Status == PaymentOrderStatus.Paid
                && o.PaidAt != null
                && o.PaidAt >= start
                && o.PaidAt <= end)
            .GroupBy(o => DateOnly.FromDateTime(o.PaidAt!.Value))
            .Select(g => new { Date = g.Key, Amount = g.Sum(o => o.Amount) })
            .ToListAsync(cancellationToken);

        return rows.Select(r => (r.Date, r.Amount)).ToList();
    }
}
