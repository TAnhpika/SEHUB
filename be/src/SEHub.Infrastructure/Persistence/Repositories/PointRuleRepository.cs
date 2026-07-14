using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PointRuleRepository : IPointRuleRepository
{
    private readonly SEHubDbContext _context;

    public PointRuleRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<PointRule>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.PointRules.OrderBy(r => r.Code).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PointRule>> GetActiveByEventTypeAsync(
        string eventType,
        CancellationToken cancellationToken = default) =>
        await _context.PointRules
            .Where(r => r.IsActive && r.EventType == eventType)
            .ToListAsync(cancellationToken);

    public Task<PointRule?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.PointRules.FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

    public Task<PointRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PointRules.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task AddAsync(PointRule rule, CancellationToken cancellationToken = default) =>
        _context.PointRules.AddAsync(rule, cancellationToken).AsTask();

    public Task UpdateAsync(PointRule rule, CancellationToken cancellationToken = default)
    {
        _context.PointRules.Update(rule);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(PointRule rule, CancellationToken cancellationToken = default)
    {
        _context.PointRules.Remove(rule);
        return Task.CompletedTask;
    }
}
