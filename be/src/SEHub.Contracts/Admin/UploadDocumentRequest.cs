namespace SEHub.Contracts.Admin;

public sealed class UploadDocumentRequest
{
    public string Title { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string SubjectCode { get; init; } = string.Empty;
    public int Semester { get; init; } = 1;
    public int PageCount { get; init; } = 1;
    public string AccessTier { get; init; } = string.Empty;
}
