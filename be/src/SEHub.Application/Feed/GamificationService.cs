using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;

namespace SEHub.Application.Feed;

public sealed class GamificationService : IGamificationService
{
    public const int PointsPerPost = 10;
    public const int PointsPerLike = 2;

    private readonly IUserRepository _userRepository;
    private readonly ILevelConfigRepository _levelConfigRepository;
    private readonly IUnitOfWork _unitOfWork;

    public GamificationService(
        IUserRepository userRepository,
        ILevelConfigRepository levelConfigRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _levelConfigRepository = levelConfigRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task AwardPostPublishedAsync(Guid authorId, CancellationToken cancellationToken = default)
    {
        await _userRepository.AddPointsAsync(authorId, PointsPerPost, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task AwardLikeReceivedAsync(Guid authorId, CancellationToken cancellationToken = default)
    {
        await _userRepository.AddPointsAsync(authorId, PointsPerLike, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<(int Points, string? LevelName, int StreakCount)> GetUserGamificationAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return (0, null, 0);
        }

        var level = await _levelConfigRepository.GetForPointsAsync(user.Points, cancellationToken);
        return (user.Points, level?.Name ?? user.LevelName, user.StreakCount);
    }
}
