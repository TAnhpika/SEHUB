using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class UserMissionProgressRepository : IUserMissionProgressRepository
{
    private readonly SEHubDbContext _context;

    public UserMissionProgressRepository(SEHubDbContext context)
    {
        _context = context;
    }

    public Task<UserMissionProgress?> GetAsync(
        Guid userId,
        string missionCode,
        string periodKey,
        CancellationToken cancellationToken = default) =>
        _context.UserMissionProgress.FirstOrDefaultAsync(
            p => p.UserId == userId && p.MissionCode == missionCode && p.PeriodKey == periodKey,
            cancellationToken);

    public async Task<UserMissionProgress> IncrementAsync(
        Guid userId,
        string missionCode,
        string periodKey,
        int targetCount,
        CancellationToken cancellationToken = default)
    {
        var progress = await GetAsync(userId, missionCode, periodKey, cancellationToken);
        if (progress is null)
        {
            progress = new UserMissionProgress
            {
                UserId = userId,
                MissionCode = missionCode,
                PeriodKey = periodKey,
                ProgressCount = 1,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserMissionProgress.Add(progress);
        }
        else
        {
            progress.ProgressCount = Math.Min(progress.ProgressCount + 1, targetCount);
            progress.UpdatedAt = DateTime.UtcNow;
        }

        if (progress.ProgressCount >= targetCount && progress.CompletedAt is null)
        {
            progress.CompletedAt = DateTime.UtcNow;
        }

        return progress;
    }
}
