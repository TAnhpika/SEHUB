using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Contracts.Gamification;

namespace SEHub.Application.Gamification.Engines;

public sealed class LeaderboardService : ILeaderboardService
{
    private readonly ILeaderboardRepository _leaderboardRepository;

    public LeaderboardService(ILeaderboardRepository leaderboardRepository) =>
        _leaderboardRepository = leaderboardRepository;

    public Task<IReadOnlyList<LeaderboardEntryDto>> GetTopAsync(int take, CancellationToken cancellationToken = default) =>
        _leaderboardRepository.GetTopAsync(take, cancellationToken);
}
