namespace SEHub.Contracts.Admin;

public sealed class AdminDocumentDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string Category { get; init; } = string.Empty;
    public int PageCount { get; init; }
    public string AccessTier { get; init; } = string.Empty;
    public string? MimeType { get; init; }
    public string? FilePath { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
