namespace SEHub.Contracts.Feed;

public sealed class PostDetailDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public IReadOnlyList<string> Tags { get; init; } = [];
    public string Status { get; init; } = string.Empty;
    public AuthorSummaryDto Author { get; init; } = null!;
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public int ViewCount { get; init; }
    public bool IsFeatured { get; init; }
    public bool? IsLiked { get; init; }
    public IReadOnlyList<PostImageDto> Images { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
