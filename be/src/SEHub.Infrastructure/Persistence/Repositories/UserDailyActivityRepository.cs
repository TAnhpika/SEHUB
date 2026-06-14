using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class UserDailyActivityRepository : IUserDailyActivityRepository
{
    private readonly SEHubDbContext _context;

    public UserDailyActivityRepository(SEHubDbContext context)
    {
        _context = context;
    }

    public async Task IncrementAsync(Guid userId, DateOnly activityDate, CancellationToken cancellationToken = default)
    {
        var existing = await _context.UserDailyActivities
            .FirstOrDefaultAsync(
                a => a.UserId == userId && a.ActivityDate == activityDate,
                cancellationToken);

        if (existing is null)
        {
            _context.UserDailyActivities.Add(new UserDailyActivity
            {
                UserId = userId,
                ActivityDate = activityDate,
                ActivityCount = 1,
            });
            return;
        }

        existing.ActivityCount += 1;
    }

    public async Task<IReadOnlyList<UserDailyActivity>> GetRangeAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default)
    {
        return await _context.UserDailyActivities
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.ActivityDate >= startDate && a.ActivityDate <= endDate)
            .OrderBy(a => a.ActivityDate)
            .ToListAsync(cancellationToken);
    }
}
