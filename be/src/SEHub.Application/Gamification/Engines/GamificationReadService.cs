using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Contracts.Gamification;
using SEHub.Shared.Constants;

namespace SEHub.Application.Gamification.Engines;

public sealed class GamificationReadService : IGamificationReadService
{
    private readonly ILevelEngine _levelEngine;
    private readonly IUserRepository _userRepository;
    private readonly IMissionRepository _missionRepository;
    private readonly IPointTransactionRepository _transactionRepository;

    public GamificationReadService(
        ILevelEngine levelEngine,
        IUserRepository userRepository,
        IMissionRepository missionRepository,
        IPointTransactionRepository transactionRepository)
    {
        _levelEngine = levelEngine;
        _userRepository = userRepository;
        _missionRepository = missionRepository;
        _transactionRepository = transactionRepository;
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
        var dayStart = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var missions = await _missionRepository.GetActiveDailyMissionsAsync(cancellationToken);

        var results = new List<DailyMissionProgressDto>(missions.Count);
        foreach (var mission in missions)
        {
            var sourceTypes = ResolveSourceTypes(mission.EventType);
            var current = await _transactionRepository.CountPostedQualifyingEventsSinceAsync(
                userId,
                sourceTypes,
                dayStart,
                cancellationToken);
            var capped = Math.Min(current, mission.TargetCount);

            results.Add(new DailyMissionProgressDto
            {
                Id = mission.Id,
                Code = mission.Code,
                Title = mission.Name,
                Current = capped,
                Target = mission.TargetCount,
                RewardPoints = mission.RewardPoints,
                IsCompleted = capped >= mission.TargetCount
            });
        }

        return results;
    }

    private static IReadOnlyList<string> ResolveSourceTypes(string eventType) =>
        eventType switch
        {
            GamificationConstants.EventDailyLogin => ["login", GamificationConstants.EventDailyLogin],
            _ => [eventType]
        };
}
