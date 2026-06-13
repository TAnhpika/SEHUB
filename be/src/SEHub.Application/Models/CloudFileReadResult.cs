namespace SEHub.Application.Models;

public sealed class CloudFileReadResult
{
    public Stream Stream { get; init; } = Stream.Null;
    public string ContentType { get; init; } = "application/octet-stream";
    public string FileName { get; init; } = string.Empty;
}
