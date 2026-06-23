namespace SEHub.Application.Models;

public sealed class CdnUploadResult
{
    public string PublicId { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
}
