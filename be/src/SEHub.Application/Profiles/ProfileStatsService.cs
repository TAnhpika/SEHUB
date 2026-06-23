using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Profiles;

public sealed class ProfileStatsService : IProfileStatsService
{
    private static readonly TimeSpan StatsCacheTtl = TimeSpan.FromMinutes(15);

    private readonly IUserRepository _userRepository;
    private readonly ILevelConfigRepository _levelConfigRepository;
    private readonly IUserBadgeRepository _badgeRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IExamAttemptRepository _examAttemptRepository;
    private readonly IGamificationService _gamificationService;
    private readonly IProfileSnapshotCache _snapshotCache;
    private readonly ICurrentUserService _currentUser;

    public ProfileStatsService(
        IUserRepository userRepository,
        ILevelConfigRepository levelConfigRepository,
        IUserBadgeRepository badgeRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        IExamAttemptRepository examAttemptRepository,
        IGamificationService gamificationService,
        IProfileSnapshotCache snapshotCache,
        ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _levelConfigRepository = levelConfigRepository;
        _badgeRepository = badgeRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _examAttemptRepository = examAttemptRepository;
        _gamificationService = gamificationService;
        _snapshotCache = snapshotCache;
        _currentUser = currentUser;
    }

    public async Task<ProfileStatsDto> GetMyStatsAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        _ = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        return await BuildStatsAsync(userId, cancellationToken);
    }

    public async Task<ProfileStatsDto> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }

        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? throw new NotFoundException($"User '{username}' was not found.");

        return await BuildStatsAsync(user.Id, cancellationToken);
    }

    private async Task<ProfileStatsDto> BuildStatsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cacheKey = ProfileStatsServiceCacheKeys.BuildStatsKey(userId);
        var cached = await _snapshotCache.GetAsync<ProfileStatsDto>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var (points, levelName, streak) = await _gamificationService.GetUserGamificationAsync(userId, cancellationToken);
        var levels = await _levelConfigRepository.GetAllOrderedAsync(cancellationToken);
        var nextLevel = levels.FirstOrDefault(l => l.MinPoints > points);

        var result = new ProfileStatsDto
        {
            Points = points,
            LevelName = levelName,
            StreakCount = streak,
            NextLevelPoints = nextLevel?.MinPoints,
            NextLevelName = nextLevel?.Name,
            BadgesCount = await _badgeRepository.CountByUserIdAsync(userId, cancellationToken),
            PostsCount = await _postRepository.CountByAuthorIdAsync(userId, cancellationToken),
            CommentsCount = await _commentRepository.CountByAuthorIdAsync(userId, cancellationToken),
            ExamsCompleted = await _examAttemptRepository.CountSubmittedByUserIdAsync(userId, cancellationToken)
        };

        await _snapshotCache.SetAsync(cacheKey, result, StatsCacheTtl, cancellationToken);
        return result;
    }
}

internal static class ProfileStatsServiceCacheKeys
{
    internal static string BuildStatsKey(Guid userId) => $"profile:stats:{userId}";
}
