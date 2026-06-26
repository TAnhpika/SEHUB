using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Application.Gamification.Models;

namespace SEHub.Application.Feed;

public sealed class GamificationService : IGamificationService
{
    private readonly IGamificationReadService _readService;
    private readonly IGamificationEventPublisher _eventPublisher;

    public GamificationService(
        IGamificationReadService readService,
        IGamificationEventPublisher eventPublisher)
    {
        _readService = readService;
        _eventPublisher = eventPublisher;
    }

    public Task AwardPostPublishedAsync(Guid authorId, Guid postId, CancellationToken cancellationToken = default) =>
        _eventPublisher.PublishAsync(new PostPublishedEvent(postId, authorId), cancellationToken);

    public Task AwardLikeReceivedAsync(Guid postId, Guid authorId, Guid likerId, CancellationToken cancellationToken = default) =>
        _eventPublisher.PublishAsync(new LikeReceivedEvent(postId, authorId, likerId), cancellationToken);

    public Task RevokeLikeReceivedAsync(Guid postId, Guid authorId, Guid likerId, CancellationToken cancellationToken = default) =>
        _eventPublisher.PublishAsync(new LikeRemovedEvent(postId, authorId, likerId), cancellationToken);

    public Task PublishPostDeletedAsync(Guid postId, Guid authorId, CancellationToken cancellationToken = default) =>
        _eventPublisher.PublishAsync(new PostDeletedEvent(postId, authorId), cancellationToken);

    public async Task<(int Points, string? LevelName, int StreakCount)> GetUserGamificationAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await _readService.GetProfileGamificationAsync(userId, cancellationToken);
        return (profile.Points, profile.LevelName, profile.CurrentStreak);
    }
}
