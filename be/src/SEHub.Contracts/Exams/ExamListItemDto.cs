namespace SEHub.Contracts.Exams;

public sealed class ExamListItemDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string SubjectName { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public int QuestionCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? AssetUrl { get; init; }
    public string? ContentHash { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? RevisionOfExamId { get; init; }
    public string? RejectionReasonCode { get; init; }
    public string? RejectionReasonDetail { get; init; }
    public DateTime? RejectedAt { get; init; }
    public bool CanResubmit { get; init; }
    public bool IsContentLocked { get; init; }
    public string? RevisionSourceCode { get; init; }
    public string? RevisionSourceTitle { get; init; }
    public string? SubmittedByUsername { get; init; }
    public string? SubmittedByDisplayName { get; init; }
    public bool IsPinned { get; init; }}
