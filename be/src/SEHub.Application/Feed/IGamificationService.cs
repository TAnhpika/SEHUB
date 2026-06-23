namespace SEHub.Application.Feed;

public interface IGamificationService
{
    Task AwardPostPublishedAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task AwardLikeReceivedAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task<(int Points, string? LevelName, int StreakCount)> GetUserGamificationAsync(Guid userId, CancellationToken cancellationToken = default);
}
