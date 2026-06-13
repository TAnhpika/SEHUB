namespace SEHub.Contracts.Feed;

public sealed class PostImageDto
{
    public Guid Id { get; init; }
    public int SortOrder { get; init; }
    public string ImagePath { get; init; } = string.Empty;
}
