namespace SEHub.Contracts.Feed;

public sealed class CreatePostRequest
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public IReadOnlyList<string>? Tags { get; init; }
    public string? CoverImageUrl { get; init; }
}
