namespace SEHub.Contracts.Users;

public sealed class UserReportDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public Guid ReportedUserId { get; init; }
    public string ReportedUsername { get; init; } = string.Empty;
    public string ReportedDisplayName { get; init; } = string.Empty;
    public string ReporterUsername { get; init; } = string.Empty;
    public string ReporterDisplayName { get; init; } = string.Empty;
    public Guid? PostId { get; init; }
    public Guid? ExamId { get; init; }
    public Guid? QuestionId { get; init; }
    public Guid? QuestionCommentId { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? ResolutionNote { get; init; }
    public int? ReportedUserTrustScore { get; init; }
    public string? ReportedUserTrustTier { get; init; }
}
