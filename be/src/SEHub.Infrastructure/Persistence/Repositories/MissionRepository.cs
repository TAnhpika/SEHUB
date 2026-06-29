using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class MissionRepository : IMissionRepository
{
    private readonly SEHubDbContext _context;

    public MissionRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<(Guid Id, string Code, string Name, string EventType, int TargetCount, int RewardPoints)>> GetActiveDailyMissionsAsync(
        CancellationToken cancellationToken = default)
    {
        var items = await _context.DailyMissions
            .Where(m => m.IsActive)
            .OrderBy(m => m.Name)
            .Select(m => new { m.Id, m.Code, m.Name, m.EventType, m.TargetCount, m.RewardPoints })
            .ToListAsync(cancellationToken);

        return items.Select(m => (m.Id, m.Code, m.Name, m.EventType, m.TargetCount, m.RewardPoints)).ToList();
    }

    public async Task<IReadOnlyList<(Guid Id, string Code, string EventType, int TargetCount, int RewardPoints)>> GetActiveDailyByEventTypeAsync(
        string eventType,
        CancellationToken cancellationToken = default)
    {
        var items = await _context.DailyMissions
            .Where(m => m.IsActive && m.EventType == eventType)
            .Select(m => new { m.Id, m.Code, m.EventType, m.TargetCount, m.RewardPoints })
            .ToListAsync(cancellationToken);

        return items.Select(m => (m.Id, m.Code, m.EventType, m.TargetCount, m.RewardPoints)).ToList();
    }

    public async Task<IReadOnlyList<(Guid Id, string Code, string EventType, int TargetCount, int RewardPoints)>> GetActiveWeeklyByEventTypeAsync(
        string eventType,
        CancellationToken cancellationToken = default)
    {
        var items = await _context.WeeklyMissions
            .Where(m => m.IsActive && m.EventType == eventType)
            .Select(m => new { m.Id, m.Code, m.EventType, m.TargetCount, m.RewardPoints })
            .ToListAsync(cancellationToken);

        return items.Select(m => (m.Id, m.Code, m.EventType, m.TargetCount, m.RewardPoints)).ToList();
    }
}
