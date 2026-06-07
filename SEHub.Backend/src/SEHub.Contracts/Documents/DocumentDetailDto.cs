namespace SEHub.Contracts.Documents;

public sealed class DocumentDetailDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int PageCount { get; init; }
    public string AccessTier { get; init; } = string.Empty;
    public string? MimeType { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool CanDownload { get; init; }
    public int PageLimit { get; init; }
}
