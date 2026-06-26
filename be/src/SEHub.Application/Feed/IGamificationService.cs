namespace SEHub.Application.Feed;

public interface IGamificationService
{
    Task AwardPostPublishedAsync(Guid authorId, Guid postId, CancellationToken cancellationToken = default);
    Task AwardLikeReceivedAsync(Guid postId, Guid authorId, Guid likerId, CancellationToken cancellationToken = default);
    Task RevokeLikeReceivedAsync(Guid postId, Guid authorId, Guid likerId, CancellationToken cancellationToken = default);
    Task PublishPostDeletedAsync(Guid postId, Guid authorId, CancellationToken cancellationToken = default);
    Task<(int Points, string? LevelName, int StreakCount)> GetUserGamificationAsync(Guid userId, CancellationToken cancellationToken = default);
}
