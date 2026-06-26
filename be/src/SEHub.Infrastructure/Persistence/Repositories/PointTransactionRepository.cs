using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PointTransactionRepository : IPointTransactionRepository
{
    private readonly SEHubDbContext _context;

    public PointTransactionRepository(SEHubDbContext context) => _context = context;

    public Task<bool> ExistsByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default) =>
        _context.PointTransactions.AnyAsync(t => t.IdempotencyKey == idempotencyKey, cancellationToken);

    public Task<PointTransaction?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default) =>
        _context.PointTransactions.FirstOrDefaultAsync(t => t.IdempotencyKey == idempotencyKey, cancellationToken);

    public Task AddAsync(PointTransaction transaction, CancellationToken cancellationToken = default) =>
        _context.PointTransactions.AddAsync(transaction, cancellationToken).AsTask();

    public async Task<IReadOnlyList<PointTransaction>> GetPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _context.PointTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.PointTransactions.CountAsync(t => t.UserId == userId, cancellationToken);

    public async Task VoidByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default)
    {
        var tx = await _context.PointTransactions
            .FirstOrDefaultAsync(t => t.IdempotencyKey == idempotencyKey && t.Status == PointTransactionStatus.Posted, cancellationToken);
        if (tx is null)
        {
            return;
        }

        tx.Status = PointTransactionStatus.Voided;
        tx.UpdatedAt = DateTime.UtcNow;
    }
}
