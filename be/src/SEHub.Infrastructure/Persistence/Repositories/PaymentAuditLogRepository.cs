using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PaymentAuditLogRepository : IPaymentAuditLogRepository
{
    private static readonly string[] PaymentCompletedActions =
    [
        "WEBHOOK_PAID",
        "N8N_ACTIVATE",
        "ADMIN_CONFIRM",
    ];

    private readonly SEHubDbContext _context;

    public PaymentAuditLogRepository(SEHubDbContext context) => _context = context;

    public async Task AddAsync(PaymentAuditLog log, CancellationToken cancellationToken = default) =>
        await _context.PaymentAuditLogs.AddAsync(log, cancellationToken);

    public async Task<IReadOnlyList<PaymentAuditLog>> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        await _context.PaymentAuditLogs
            .Where(l => l.OrderId == orderId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<DateTime?> GetPaymentCompletedAtUtcAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        _context.PaymentAuditLogs
            .Where(l => l.OrderId == orderId && PaymentCompletedActions.Contains(l.Action))
            .OrderBy(l => l.CreatedAt)
            .Select(l => (DateTime?)l.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(IReadOnlyList<PaymentAuditLog> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.PaymentAuditLogs.AsQueryable();
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<bool> ExistsByExternalReferenceAsync(string reference, CancellationToken cancellationToken = default) =>
        _context.PaymentAuditLogs.AnyAsync(l => l.PayloadJson.Contains(reference), cancellationToken);
}
