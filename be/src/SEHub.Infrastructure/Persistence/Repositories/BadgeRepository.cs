using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class BadgeRepository : IBadgeRepository
{
    private readonly SEHubDbContext _context;

    public BadgeRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Badges.OrderBy(b => b.Name).ToListAsync(cancellationToken);

    public Task<Badge?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Badges.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public Task<Badge?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.Badges.FirstOrDefaultAsync(b => b.Code == code, cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> GetEarnedCountsAsync(CancellationToken cancellationToken = default)
    {
        var counts = await _context.UserBadges
            .GroupBy(ub => ub.BadgeId)
            .Select(g => new { BadgeId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.BadgeId, x => x.Count);
    }

    public async Task AddAsync(Badge badge, CancellationToken cancellationToken = default) =>
        await _context.Badges.AddAsync(badge, cancellationToken);

    public Task UpdateAsync(Badge badge, CancellationToken cancellationToken = default)
    {
        _context.Badges.Update(badge);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Badge badge, CancellationToken cancellationToken = default)
    {
        _context.Badges.Remove(badge);
        return Task.CompletedTask;
    }
}
