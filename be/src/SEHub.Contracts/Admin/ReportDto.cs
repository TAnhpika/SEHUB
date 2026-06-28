namespace SEHub.Contracts.Admin;

public sealed class ReportDto
{
    public Guid Id { get; init; }
    public string Kind { get; init; } = "post";
    public Guid PostId { get; init; }
    public Guid? CommentId { get; init; }
    public string PostTitle { get; init; } = string.Empty;
    public string? PostExcerpt { get; init; }
    public string? CommentExcerpt { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public ReportUserSummaryDto Reporter { get; init; } = null!;
    public ReportUserSummaryDto? ReportedUser { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
}

public sealed class ReportUserSummaryDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
}
