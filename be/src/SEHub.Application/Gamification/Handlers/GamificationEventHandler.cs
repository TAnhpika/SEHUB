using MediatR;
using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Application.Profiles;
using SEHub.Shared.Constants;

namespace SEHub.Application.Gamification.Handlers;

public sealed class GamificationEventHandler : INotificationHandler<GamificationEventNotification>
{
    private readonly IPointEngine _pointEngine;
    private readonly ILevelEngine _levelEngine;
    private readonly IStreakEngine _streakEngine;
    private readonly IHeatmapProjection _heatmapProjection;
    private readonly IAchievementEngine _achievementEngine;
    private readonly IMissionProgressService _missionProgressService;
    private readonly IUserRepository _userRepository;
    private readonly IProfileActivityCache _activityCache;
    private readonly IProfileSnapshotCache _snapshotCache;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GamificationEventHandler> _logger;

    public GamificationEventHandler(
        IPointEngine pointEngine,
        ILevelEngine levelEngine,
        IStreakEngine streakEngine,
        IHeatmapProjection heatmapProjection,
        IAchievementEngine achievementEngine,
        IMissionProgressService missionProgressService,
        IUserRepository userRepository,
        IProfileActivityCache activityCache,
        IProfileSnapshotCache snapshotCache,
        IUnitOfWork unitOfWork,
        ILogger<GamificationEventHandler> logger)
    {
        _pointEngine = pointEngine;
        _levelEngine = levelEngine;
        _streakEngine = streakEngine;
        _heatmapProjection = heatmapProjection;
        _achievementEngine = achievementEngine;
        _missionProgressService = missionProgressService;
        _userRepository = userRepository;
        _activityCache = activityCache;
        _snapshotCache = snapshotCache;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(GamificationEventNotification notification, CancellationToken cancellationToken)
    {
        var @event = notification.Event;
        try
        {
            if (await _userRepository.IsCurrentlyBannedAsync(@event.UserId, cancellationToken))
            {
                return;
            }

            await ProcessEventAsync(@event, cancellationToken);
            _activityCache.InvalidateUser(@event.UserId);
            _snapshotCache.InvalidateStats(@event.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gamification pipeline failed for {EventType} user {UserId}", @event.EventType, @event.UserId);
        }
    }

    private async Task ProcessEventAsync(IGamificationEvent @event, CancellationToken cancellationToken)
    {
        switch (@event)
        {
            case LikeReceivedEvent like when like.AuthorId == like.LikerId:
                return;

            case LikeReceivedEvent like:
                await _pointEngine.AwardByEventTypeAsync(
                    like.AuthorId,
                    GamificationConstants.EventLikeReceived,
                    like.IdempotencyKey,
                    "like",
                    like.PostId,
                    cancellationToken);
                await _levelEngine.RecalculateAsync(like.AuthorId, cancellationToken);
                await _missionProgressService.TrackEventAsync(like.AuthorId, like.EventType, cancellationToken);
                return;

            case LikeRemovedEvent unlike:
                await _pointEngine.VoidByIdempotencyKeyAsync(
                    unlike.AuthorId,
                    $"like.received:{unlike.PostId}:{unlike.LikerId}",
                    unlike.IdempotencyKey,
                    GamificationConstants.EventLikeRemoved,
                    cancellationToken);
                await _levelEngine.RecalculateAsync(unlike.AuthorId, cancellationToken);
                return;

            case PostDeletedEvent deleted:
                await _pointEngine.VoidByIdempotencyKeyAsync(
                    deleted.AuthorId,
                    $"post.published:{deleted.PostId}",
                    deleted.IdempotencyKey,
                    GamificationConstants.EventPostDeleted,
                    cancellationToken);
                await _levelEngine.RecalculateAsync(deleted.AuthorId, cancellationToken);
                return;

            case CommentDeletedEvent commentDeleted:
                await _pointEngine.VoidByIdempotencyKeyAsync(
                    commentDeleted.AuthorId,
                    $"comment.created:{commentDeleted.CommentId}",
                    commentDeleted.IdempotencyKey,
                    GamificationConstants.EventCommentDeleted,
                    cancellationToken);
                await _levelEngine.RecalculateAsync(commentDeleted.AuthorId, cancellationToken);
                return;

            case DailyLoginEvent login:
                if (await _userRepository.TryApplyDailyLoginBonusAsync(login.UserId, cancellationToken))
                {
                    await _pointEngine.AwardByEventTypeAsync(
                        login.UserId,
                        GamificationConstants.EventDailyLogin,
                        login.IdempotencyKey,
                        "login",
                        null,
                        cancellationToken);
                    await _levelEngine.RecalculateAsync(login.UserId, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
                return;

            default:
                await _pointEngine.AwardByEventTypeAsync(
                    @event.UserId,
                    @event.EventType,
                    @event.IdempotencyKey,
                    @event.EventType,
                    GetSourceId(@event),
                    cancellationToken);
                await _levelEngine.RecalculateAsync(@event.UserId, cancellationToken);

                if (IsQualifyingStreakEvent(@event))
                {
                    await _streakEngine.RecordQualifyingActivityAsync(@event.UserId, cancellationToken);
                    await _heatmapProjection.IncrementAsync(@event.UserId, cancellationToken);
                }

                foreach (var trigger in MapAchievementTriggers(@event))
                {
                    await _achievementEngine.EvaluateForTriggerAsync(@event.UserId, trigger, cancellationToken);
                }

                await _missionProgressService.TrackEventAsync(@event.UserId, @event.EventType, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return;
        }
    }

    private static bool IsQualifyingStreakEvent(IGamificationEvent @event) =>
        @event is PostPublishedEvent or CommentCreatedEvent or ExamCompletedEvent or AiUsedEvent or DocumentReadEvent or PracticeSubmittedEvent;

    private static Guid? GetSourceId(IGamificationEvent @event) => @event switch
    {
        PostPublishedEvent e => e.PostId,
        CommentCreatedEvent e => e.CommentId,
        ExamCompletedEvent e => e.AttemptId,
        DocumentApprovedEvent e => e.DocumentId,
        DocumentReadEvent e => e.DocumentId,
        AiUsedEvent e => e.ReferenceId,
        _ => null
    };

    private static IEnumerable<string> MapAchievementTriggers(IGamificationEvent @event)
    {
        switch (@event)
        {
            case PostPublishedEvent:
                return [BadgeCheckService.TriggerPostsPublished];
            case CommentCreatedEvent:
                return [BadgeCheckService.TriggerCommentsCreated];
            case ExamCompletedEvent e:
            {
                var triggers = new List<string> { BadgeCheckService.TriggerExamsCompleted };
                if (e.Score == 100)
                {
                    triggers.Add(BadgeCheckService.TriggerPerfectExams);
                }

                if (e.Score >= 80)
                {
                    triggers.Add(BadgeCheckService.TriggerHighScoreExams);
                }

                return triggers;
            }
            case PracticeSubmittedEvent:
                return [BadgeCheckService.TriggerPracticeSubmissions];
            default:
                return Array.Empty<string>();
        }
    }
}
