namespace SEHub.Contracts.Feed;

public sealed class FeaturedPostDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public AuthorSummaryDto Author { get; init; } = null!;
    public DateTime CreatedAt { get; init; }
}
