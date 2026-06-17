namespace SEHub.Contracts.Exams;

public sealed class ExamAttachmentDto
{
    public Guid Id { get; init; }
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string ViewPath { get; init; } = string.Empty;
}
