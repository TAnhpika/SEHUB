namespace SEHub.Application.Models;

public sealed class CloudFileUploadResult
{
    public string DriveFileId { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
}
