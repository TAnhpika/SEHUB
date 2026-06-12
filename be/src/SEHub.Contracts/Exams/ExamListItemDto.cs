namespace SEHub.Contracts.Exams;

public sealed class ExamListItemDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public int QuestionCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
