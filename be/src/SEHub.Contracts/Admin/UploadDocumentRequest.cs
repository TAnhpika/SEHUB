namespace SEHub.Contracts.Admin;

public sealed class UploadDocumentRequest
{
    public string Title { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string AccessTier { get; init; } = string.Empty;
}
