namespace SEHub.Contracts.Admin;

public sealed class FeaturedPostModeratorItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string AuthorUsername { get; init; } = string.Empty;
    public string AuthorDisplayName { get; init; } = string.Empty;
    public bool IsFeatured { get; init; }
    public bool IsPinned { get; init; }
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class FeaturedPostsStateDto
{
    public IReadOnlyList<FeaturedPostModeratorItemDto> Pinned { get; init; } = [];
    public IReadOnlyList<FeaturedPostModeratorItemDto> Candidates { get; init; } = [];
    public int MaxPinned { get; init; } = 5;
}
