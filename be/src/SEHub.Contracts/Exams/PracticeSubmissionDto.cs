namespace SEHub.Contracts.Exams;

public sealed class PracticeSubmissionDto
{
    public Guid Id { get; init; }
    public Guid ExamId { get; init; }
    public string GitHubRepoUrl { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime SubmittedAt { get; init; }
    public string? ReviewerComment { get; init; }
    public DateTime? ReviewedAt { get; init; }
}
