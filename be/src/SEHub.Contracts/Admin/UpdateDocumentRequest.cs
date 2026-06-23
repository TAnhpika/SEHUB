namespace SEHub.Contracts.Admin;

public sealed class UpdateDocumentRequest
{
    public string? Title { get; init; }
    public string? AccessTier { get; init; }
    public int? PageCount { get; init; }
    public Guid? CategoryId { get; init; }
}
