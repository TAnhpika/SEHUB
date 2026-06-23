namespace SEHub.Contracts.Admin;

public sealed class PinnedPostsStateDto
{
    public IReadOnlyList<FeaturedPostModeratorItemDto> Pinned { get; init; } = [];
    public IReadOnlyList<FeaturedPostModeratorItemDto> Candidates { get; init; } = [];
    public int MaxPinned { get; init; } = 5;
}
