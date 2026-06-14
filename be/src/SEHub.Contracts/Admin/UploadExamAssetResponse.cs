namespace SEHub.Contracts.Admin;

public sealed class UploadExamAssetResponse
{
    public string Url { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
}
