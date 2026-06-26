using SEHub.Shared.Constants;

namespace SEHub.Application.Gamification.Events;

public sealed record PostPublishedEvent(Guid PostId, Guid AuthorId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventPostPublished;
    public string IdempotencyKey => $"post.published:{PostId}";
    public Guid UserId => AuthorId;
}

public sealed record PostDeletedEvent(Guid PostId, Guid AuthorId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventPostDeleted;
    public string IdempotencyKey => $"post.deleted:{PostId}";
    public Guid UserId => AuthorId;
}

public sealed record LikeReceivedEvent(Guid PostId, Guid AuthorId, Guid LikerId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventLikeReceived;
    public string IdempotencyKey => $"like.received:{PostId}:{LikerId}";
    public Guid UserId => AuthorId;
}

public sealed record LikeRemovedEvent(Guid PostId, Guid AuthorId, Guid LikerId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventLikeRemoved;
    public string IdempotencyKey => $"like.removed:{PostId}:{LikerId}";
    public Guid UserId => AuthorId;
}

public sealed record CommentCreatedEvent(Guid CommentId, Guid AuthorId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventCommentCreated;
    public string IdempotencyKey => $"comment.created:{CommentId}";
    public Guid UserId => AuthorId;
}

public sealed record CommentDeletedEvent(Guid CommentId, Guid AuthorId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventCommentDeleted;
    public string IdempotencyKey => $"comment.deleted:{CommentId}";
    public Guid UserId => AuthorId;
}

public sealed record DailyLoginEvent(Guid UserId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventDailyLogin;
    public string IdempotencyKey => $"auth.daily_login:{UserId}:{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}";
}

public sealed record ExamCompletedEvent(Guid AttemptId, Guid UserId, int? Score) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventExamCompleted;
    public string IdempotencyKey => $"exam.completed:{AttemptId}";
}

public sealed record DocumentApprovedEvent(Guid DocumentId, Guid UploaderId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventDocumentApproved;
    public string IdempotencyKey => $"document.approved:{DocumentId}";
    public Guid UserId => UploaderId;
}

public sealed record AiUsedEvent(Guid UserId, string Feature, Guid? ReferenceId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventAiUsed;
    public string IdempotencyKey => $"ai.used:{UserId}:{Feature}:{ReferenceId}:{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}";
}

public sealed record DocumentReadEvent(Guid DocumentId, Guid UserId) : IGamificationEvent
{
    public string EventType => GamificationConstants.EventDocumentRead;
    public string IdempotencyKey => $"document.read:{DocumentId}:{UserId}:{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}";
}

public sealed record PracticeSubmittedEvent(Guid SubmissionId, Guid UserId) : IGamificationEvent
{
    public string EventType => "practice.submitted";
    public string IdempotencyKey => $"practice.submitted:{SubmissionId}";
}
