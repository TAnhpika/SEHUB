using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class SubscriptionPlanRepository : ISubscriptionPlanRepository
{
    private readonly SEHubDbContext _context;

    public SubscriptionPlanRepository(SEHubDbContext context) => _context = context;

    public Task<SubscriptionPlan?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Code == code, cancellationToken);

    public Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<IReadOnlyList<SubscriptionPlan>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.SubscriptionPlans.OrderBy(p => p.DurationDays).ToListAsync(cancellationToken);
}
