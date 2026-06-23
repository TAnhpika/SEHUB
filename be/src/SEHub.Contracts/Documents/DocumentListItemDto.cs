namespace SEHub.Contracts.Documents;

public sealed class DocumentListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int PageCount { get; init; }
    public string AccessTier { get; init; } = string.Empty;
}
