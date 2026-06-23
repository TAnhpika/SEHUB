using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly SEHubDbContext _context;

    public SubscriptionRepository(SEHubDbContext context) => _context = context;

    public Task<Subscription?> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.IsActive && s.EndAt > DateTime.UtcNow)
            .OrderByDescending(s => s.EndAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(Subscription subscription, CancellationToken cancellationToken = default) =>
        await _context.Subscriptions.AddAsync(subscription, cancellationToken);

    public Task UpdateAsync(Subscription subscription, CancellationToken cancellationToken = default)
    {
        _context.Subscriptions.Update(subscription);
        return Task.CompletedTask;
    }

    public async Task DeactivateAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var subs = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync(cancellationToken);
        foreach (var sub in subs)
        {
            sub.IsActive = false;
            sub.UpdatedAt = DateTime.UtcNow;
        }
    }

    public Task<int> CountActiveAsync(CancellationToken cancellationToken = default) =>
        _context.Subscriptions.CountAsync(
            s => s.IsActive && s.EndAt > DateTime.UtcNow,
            cancellationToken);
}
