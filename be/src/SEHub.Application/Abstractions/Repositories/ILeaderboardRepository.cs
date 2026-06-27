using SEHub.Application.Gamification.Abstractions;
using SEHub.Contracts.Gamification;

namespace SEHub.Application.Abstractions.Repositories;

public interface ILeaderboardRepository
{
    Task<IReadOnlyList<LeaderboardEntryDto>> GetTopAsync(int take, CancellationToken cancellationToken = default);
}

public interface IMissionRepository
{
    Task<IReadOnlyList<(Guid Id, string Code, string Name, string EventType, int TargetCount, int RewardPoints)>> GetActiveDailyMissionsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(Guid Id, string Code, string EventType, int RewardPoints)>> GetActiveDailyByEventTypeAsync(
        string eventType,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(Guid Id, string Code, string EventType, int RewardPoints)>> GetActiveWeeklyByEventTypeAsync(
        string eventType,
        CancellationToken cancellationToken = default);
}
