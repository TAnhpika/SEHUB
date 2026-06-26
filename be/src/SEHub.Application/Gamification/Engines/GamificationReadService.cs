using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;

namespace SEHub.Application.Gamification.Engines;

public sealed class GamificationReadService : IGamificationReadService
{
    private readonly ILevelEngine _levelEngine;
    private readonly IUserRepository _userRepository;

    public GamificationReadService(ILevelEngine levelEngine, IUserRepository userRepository)
    {
        _levelEngine = levelEngine;
        _userRepository = userRepository;
    }

    public async Task<GamificationProfileDto> GetProfileGamificationAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var snapshot = await _levelEngine.BuildSnapshotAsync(userId, cancellationToken);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);

        return new GamificationProfileDto
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
}
