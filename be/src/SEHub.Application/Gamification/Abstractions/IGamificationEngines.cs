using SEHub.Application.Gamification.Models;

namespace SEHub.Application.Gamification.Abstractions;

public interface IPointEngine
{
    Task<PointAwardResult> AwardByEventTypeAsync(
        Guid userId,
        string eventType,
        string idempotencyKey,
        string sourceType,
        Guid? sourceId,
        CancellationToken cancellationToken = default);

    Task<PointAwardResult> VoidByIdempotencyKeyAsync(
        Guid userId,
        string originalIdempotencyKey,
        string voidIdempotencyKey,
        string eventType,
        CancellationToken cancellationToken = default);
}

public interface ILevelEngine
{
    Task<LevelSnapshot> RecalculateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<LevelSnapshot> BuildSnapshotAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IStreakEngine
{
    Task<StreakSnapshot> RecordQualifyingActivityAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IRewardEngine
{
    Task GrantLevelRewardsAsync(Guid userId, Guid newLevelId, CancellationToken cancellationToken = default);
}

public interface IHeatmapProjection
{
    Task IncrementAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IAchievementEngine
{
    Task EvaluateForTriggerAsync(Guid userId, string triggerType, CancellationToken cancellationToken = default);
}

public interface IGamificationReadService
{
    Task<GamificationProfileDto> GetProfileGamificationAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface ILeaderboardService
{
    Task<IReadOnlyList<SEHub.Contracts.Gamification.LeaderboardEntryDto>> GetTopAsync(int take, CancellationToken cancellationToken = default);
}

public interface IMissionProgressService
{
    Task TrackEventAsync(Guid userId, string eventType, CancellationToken cancellationToken = default);
}
