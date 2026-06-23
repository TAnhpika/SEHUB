namespace SEHub.Contracts.Exams;

public sealed class ExamDetailDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public int QuestionCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? AssetUrl { get; init; }
    public IReadOnlyList<ExamAttachmentDto> Attachments { get; init; } = [];
}
