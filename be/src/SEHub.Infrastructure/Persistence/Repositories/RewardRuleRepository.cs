using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class RewardRuleRepository : IRewardRuleRepository
{
    private readonly SEHubDbContext _context;

    public RewardRuleRepository(SEHubDbContext context) => _context = context;

    public Task<IReadOnlyList<RewardRule>> GetAllActiveAsync(CancellationToken cancellationToken = default) =>
        _context.RewardRules
            .Include(r => r.Level)
            .Where(r => r.IsActive)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<RewardRule>)t.Result, cancellationToken);

    public Task<RewardRule?> GetByLevelIdAsync(Guid levelId, CancellationToken cancellationToken = default) =>
        _context.RewardRules.FirstOrDefaultAsync(r => r.LevelId == levelId && r.IsActive, cancellationToken);

    public Task<RewardRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.RewardRules.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task AddAsync(RewardRule rule, CancellationToken cancellationToken = default) =>
        _context.RewardRules.AddAsync(rule, cancellationToken).AsTask();

    public Task UpdateAsync(RewardRule rule, CancellationToken cancellationToken = default)
    {
        _context.RewardRules.Update(rule);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(RewardRule rule, CancellationToken cancellationToken = default)
    {
        _context.RewardRules.Remove(rule);
        return Task.CompletedTask;
    }
}
