namespace SEHub.Shared.Constants;

public static class GamificationConstants
{
    public const int MaxFeaturedPosts = 5;
    public const int MaxPinnedFeedPosts = 5;
    public const int PointsPerPost = 10;
    public const int PointsPerLike = 2;
    public const int StreakMilestoneDays = 7;
    public const int StreakMilestonePoints = 20;
    public const int ExpectedBadgeCount = 26;

    public const string EventPostPublished = "post.published";
    public const string EventPostDeleted = "post.deleted";
    public const string EventLikeReceived = "like.received";
    public const string EventLikeRemoved = "like.removed";
    public const string EventCommentCreated = "comment.created";
    public const string EventCommentDeleted = "comment.deleted";
    public const string EventDailyLogin = "auth.daily_login";
    public const string EventStreakMilestone7 = "streak.milestone_7";
    public const string EventExamCompleted = "exam.completed";
    public const string EventDocumentApproved = "document.approved";
    public const string EventAiUsed = "ai.used";
    public const string EventDocumentRead = "document.read";
}
