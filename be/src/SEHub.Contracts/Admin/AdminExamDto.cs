using SEHub.Contracts.Exams;

namespace SEHub.Contracts.Admin;

public sealed class AdminExamDto
{
    public Guid Id { get; init; }
    public string SubjectCode { get; init; } = string.Empty;
    public string PaperCode { get; init; } = string.Empty;
    public string SubjectName { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public int QuestionCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ContentHash { get; init; }
    public IReadOnlyList<ExamAttachmentDto> Attachments { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? RevisionOfExamId { get; init; }
    public string? RejectionReasonCode { get; init; }
    public string? RejectionReasonDetail { get; init; }
    public DateTime? RejectedAt { get; init; }
    public bool CanResubmit { get; init; }
    public bool IsContentLocked { get; init; }
    public string? RevisionSourceSubjectCode { get; init; }
    public string? RevisionSourcePaperCode { get; init; }
    public string? SubmittedByUsername { get; init; }
    public string? SubmittedByDisplayName { get; init; }
    public bool IsPinned { get; init; }
    public IReadOnlyList<AdminExamQuestionDto> Questions { get; init; } = [];
}

public sealed class AdminExamQuestionDto
{
    public Guid Id { get; init; }
    public int OrderIndex { get; init; }
    public string Content { get; init; } = string.Empty;
    public string QuestionType { get; init; } = "SingleChoice";
    public int? RequiredSelectCount { get; init; }
    public Guid CorrectOptionId { get; init; }
    public IReadOnlyList<Guid> CorrectOptionIds { get; init; } = [];
    public IReadOnlyList<AdminExamOptionDto> Options { get; init; } = [];
}

public sealed class AdminExamOptionDto
{
    public Guid Id { get; init; }
    public string Label { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
}
