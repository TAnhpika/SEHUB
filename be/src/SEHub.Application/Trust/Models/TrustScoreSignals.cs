using SEHub.Domain.Enums;

namespace SEHub.Application.Trust.Models;

public sealed class TrustReportPenaltyRow
{
    public string ReasonId { get; init; } = "other";
    public ReportStatus Status { get; init; }
    public int Count { get; init; }
}

public sealed class TrustScoreSignals
{
    public string Role { get; init; } = string.Empty;
    public bool IsBanned { get; init; }
    public DateTime? BanUntil { get; init; }
    public BanType? ActiveBanType { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public int StreakCount { get; init; }
    public int HighestStreak { get; init; }
    public int BadgesCount { get; init; }
    public int PostsCount { get; init; }
    public int CommentsCount { get; init; }
    public int LikesReceived { get; init; }
    public int ExamsCompleted { get; init; }
    public int HighScoreExams { get; init; }
    public int PracticePassed { get; init; }
    public int WarningCount { get; init; }
    public int TempBanCount { get; init; }
    public bool EmailConfirmed { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastActivityDate { get; init; }
    public IReadOnlyList<TrustReportPenaltyRow> ReportPenalties { get; init; } = [];
}
