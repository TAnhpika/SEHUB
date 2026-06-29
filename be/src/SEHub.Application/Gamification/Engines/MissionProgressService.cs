using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;

namespace SEHub.Application.Gamification.Engines;

public sealed class MissionProgressService : IMissionProgressService
{
    private readonly IMissionRepository _missionRepository;
    private readonly IUserMissionProgressRepository _missionProgressRepository;
    private readonly IPointEngine _pointEngine;
    private readonly IUnitOfWork _unitOfWork;

    public MissionProgressService(
        IMissionRepository missionRepository,
        IUserMissionProgressRepository missionProgressRepository,
        IPointEngine pointEngine,
        IUnitOfWork unitOfWork)
    {
        _missionRepository = missionRepository;
        _missionProgressRepository = missionProgressRepository;
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
            var periodKey = today.ToString("yyyy-MM-dd");
            var progress = await _missionProgressRepository.IncrementAsync(
                userId,
                mission.Code,
                periodKey,
                mission.TargetCount,
                cancellationToken);

            if (progress.ProgressCount >= mission.TargetCount && mission.RewardPoints > 0)
            {
                var key = $"daily-mission:{mission.Code}:{userId}:{periodKey}";
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
            var periodKey = weekStart.ToString("yyyy-MM-dd");
            var progress = await _missionProgressRepository.IncrementAsync(
                userId,
                mission.Code,
                periodKey,
                mission.TargetCount,
                cancellationToken);

            if (progress.ProgressCount >= mission.TargetCount && mission.RewardPoints > 0)
            {
                var key = $"weekly-mission:{mission.Code}:{userId}:{periodKey}";
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
