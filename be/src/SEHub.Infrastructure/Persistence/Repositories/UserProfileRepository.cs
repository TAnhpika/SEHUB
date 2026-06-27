using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly SEHubDbContext _context;

    public UserProfileRepository(SEHubDbContext context) => _context = context;

    public Task<UserProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

    public async Task<IReadOnlyList<UserProfile>> GetByUserIdsAsync(
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        if (userIds.Count == 0)
        {
            return [];
        }

        return await _context.UserProfiles
            .Where(p => userIds.Contains(p.UserId))
            .ToListAsync(cancellationToken);
    }

    public Task<UserProfile?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default) =>
        (from profile in _context.UserProfiles
         join user in _context.Users on profile.UserId equals user.Id
         where user.UserName == username
         select profile).FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(UserProfile profile, CancellationToken cancellationToken = default) =>
        await _context.UserProfiles.AddAsync(profile, cancellationToken);

    public Task UpdateAsync(UserProfile profile, CancellationToken cancellationToken = default)
    {
        _context.UserProfiles.Update(profile);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<(DateOnly Date, int Count)>> GetRegistrationCountsByDateRangeAsync(
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        var start = startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = endDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var rows = await _context.UserProfiles
            .AsNoTracking()
            .Where(p => p.CreatedAt >= start && p.CreatedAt <= end)
            .GroupBy(p => DateOnly.FromDateTime(p.CreatedAt))
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return rows.Select(r => (r.Date, r.Count)).ToList();
    }
}
