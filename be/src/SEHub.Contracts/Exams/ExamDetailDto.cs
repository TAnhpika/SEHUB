namespace SEHub.Contracts.Exams;

public sealed class ExamDetailDto
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
    public IReadOnlyList<ExamAttachmentDto> Attachments { get; init; } = [];
}
