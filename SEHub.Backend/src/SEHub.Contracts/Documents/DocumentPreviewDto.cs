namespace SEHub.Contracts.Documents;

public sealed class DocumentPreviewDto
{
    public int Page { get; init; }
    public int TotalPages { get; init; }
    public int PageLimit { get; init; }
    public string? ContentUrl { get; init; }
}
