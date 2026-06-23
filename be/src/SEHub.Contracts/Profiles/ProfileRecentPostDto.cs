namespace SEHub.Contracts.Profiles;

public sealed class ProfileRecentPostDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public int LikeCount { get; init; }
    public int CommentCount { get; init; }
    public DateTime CreatedAt { get; init; }
}
