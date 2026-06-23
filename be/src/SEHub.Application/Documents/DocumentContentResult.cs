namespace SEHub.Application.Documents;

public sealed class DocumentContentResult
{
    public Stream Stream { get; init; } = Stream.Null;
    public string ContentType { get; init; } = "application/octet-stream";
    public string FileName { get; init; } = "document";
}
