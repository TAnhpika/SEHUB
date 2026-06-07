namespace SEHub.Contracts.Exams;

public sealed class ReviewPracticeRequest
{
    public string Status { get; init; } = string.Empty;
    public string? ReviewerComment { get; init; }
}
