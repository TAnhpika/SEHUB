using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;

namespace SEHub.Application.Gamification.Engines;

public sealed class MissionProgressService : IMissionProgressService
{
    private readonly IMissionRepository _missionRepository;
    private readonly IPointEngine _pointEngine;
    private readonly IUnitOfWork _unitOfWork;

    public MissionProgressService(
        IMissionRepository missionRepository,
        IPointEngine pointEngine,
        IUnitOfWork unitOfWork)
    {
        _missionRepository = missionRepository;
        _pointEngine = pointEngine;
        _unitOfWork = unitOfWork;
    }

    public async Task TrackEventAsync(Guid userId, string eventType, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);

        var dailyMissions = await _missionRepository.GetActiveDailyByEventTypeAsync(eventType, cancellationToken);
        foreach (var mission in dailyMissions)
        {
            var key = $"daily-mission:{mission.Code}:{userId}:{today:yyyy-MM-dd}";
            if (mission.RewardPoints > 0)
            {
                await _pointEngine.AwardByEventTypeAsync(
                    userId,
                    $"mission.daily.{mission.Code}",
                    key,
                    "daily_mission",
                    mission.Id,
                    cancellationToken);
            }
        }

        var weeklyMissions = await _missionRepository.GetActiveWeeklyByEventTypeAsync(eventType, cancellationToken);
        foreach (var mission in weeklyMissions)
        {
            var key = $"weekly-mission:{mission.Code}:{userId}:{weekStart:yyyy-MM-dd}";
            if (mission.RewardPoints > 0)
            {
                await _pointEngine.AwardByEventTypeAsync(
                    userId,
                    $"mission.weekly.{mission.Code}",
                    key,
                    "weekly_mission",
                    mission.Id,
                    cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
