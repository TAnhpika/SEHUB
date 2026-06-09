using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Profiles;

public sealed class ProfileStatsService : IProfileStatsService
{
    private readonly IUserRepository _userRepository;
    private readonly ILevelConfigRepository _levelConfigRepository;
    private readonly IUserBadgeRepository _badgeRepository;
    private readonly IGamificationService _gamificationService;
    private readonly ICurrentUserService _currentUser;

    public ProfileStatsService(
        IUserRepository userRepository,
        ILevelConfigRepository levelConfigRepository,
        IUserBadgeRepository badgeRepository,
        IGamificationService gamificationService,
        ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _levelConfigRepository = levelConfigRepository;
        _badgeRepository = badgeRepository;
        _gamificationService = gamificationService;
        _currentUser = currentUser;
    }

    public async Task<ProfileStatsDto> GetMyStatsAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var (points, levelName, streak) = await _gamificationService.GetUserGamificationAsync(userId, cancellationToken);
        var levels = await _levelConfigRepository.GetAllOrderedAsync(cancellationToken);
        var nextLevel = levels.FirstOrDefault(l => l.MinPoints > points);

        return new ProfileStatsDto
        {
            Points = points,
            LevelName = levelName,
            StreakCount = streak,
            NextLevelPoints = nextLevel?.MinPoints,
            BadgesCount = await _badgeRepository.CountByUserIdAsync(userId, cancellationToken)
        };
    }
}
