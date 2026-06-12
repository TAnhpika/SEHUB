namespace SEHub.Contracts.Friends;

public sealed class FriendListItemDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string? LevelName { get; init; }
    public DateTime FriendsSince { get; init; }
}
