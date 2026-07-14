namespace SEHub.Contracts.Feed;

public sealed class UpdatePostRequest
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public IReadOnlyList<string>? Tags { get; init; }
}
