using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserBadgeRepository : IUserBadgeRepository
{
    private readonly SEHubDbContext _context;

    public UserBadgeRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<UserBadge>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserId == userId)
            .OrderByDescending(ub => ub.EarnedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBadges.CountAsync(ub => ub.UserId == userId, cancellationToken);
}
