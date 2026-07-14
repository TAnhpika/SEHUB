using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Contracts.Gamification;

namespace SEHub.Application.Gamification.Engines;

public sealed class GamificationReadService : IGamificationReadService
{
    private readonly ILevelEngine _levelEngine;
    private readonly IUserRepository _userRepository;
    private readonly IMissionRepository _missionRepository;
    private readonly IUserMissionProgressRepository _missionProgressRepository;

    public GamificationReadService(
        ILevelEngine levelEngine,
        IUserRepository userRepository,
        IMissionRepository missionRepository,
        IUserMissionProgressRepository missionProgressRepository)
    {
        _levelEngine = levelEngine;
        _userRepository = userRepository;
        _missionRepository = missionRepository;
        _missionProgressRepository = missionProgressRepository;
    }

    public async Task<Models.GamificationProfileDto> GetProfileGamificationAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var snapshot = await _levelEngine.BuildSnapshotAsync(userId, cancellationToken);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);

        return new Models.GamificationProfileDto
        {
            Points = snapshot.Points,
            LevelName = snapshot.LevelName,
            NextLevelName = snapshot.NextLevelName,
            NextLevelPoints = snapshot.NextLevelPoints,
            ProgressPercent = snapshot.ProgressPercent,
            RemainingPoints = snapshot.RemainingPoints,
            CurrentStreak = user?.StreakCount ?? 0,
            HighestStreak = user?.HighestStreak ?? 0
        };
    }

    public async Task<IReadOnlyList<DailyMissionProgressDto>> GetDailyMissionProgressAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var periodKey = today.ToString("yyyy-MM-dd");
        var missions = await _missionRepository.GetActiveDailyMissionsAsync(cancellationToken);
        var pickedMissions = DailyMissionPicker.PickForUser(
            userId,
            today,
            missions,
            static mission => mission.Code);

        var results = new List<DailyMissionProgressDto>(pickedMissions.Count);
        foreach (var mission in pickedMissions)
        {
            var progress = await _missionProgressRepository.GetAsync(
                userId,
                mission.Code,
                periodKey,
                cancellationToken);
            var current = Math.Min(progress?.ProgressCount ?? 0, mission.TargetCount);
            var isCompleted = progress?.CompletedAt is not null || current >= mission.TargetCount;

            results.Add(new DailyMissionProgressDto
            {
                Id = mission.Id,
                Code = mission.Code,
                Title = mission.Name,
                Current = current,
                Target = mission.TargetCount,
                RewardPoints = mission.RewardPoints,
                IsCompleted = isCompleted
            });
        }

        return results;
    }
}
