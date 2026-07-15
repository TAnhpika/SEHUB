namespace SEHub.Contracts.Feed;

public sealed class PostListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string ContentPreview { get; init; } = string.Empty;
    public AuthorSummaryDto Author { get; init; } = null!;
    public IReadOnlyList<string> Tags { get; init; } = [];
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public int ViewCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool IsPinned { get; init; }
    public bool IsFeatured { get; init; }
    public bool? IsLiked { get; init; }
    public IReadOnlyList<PostImageDto> Images { get; init; } = [];
}
