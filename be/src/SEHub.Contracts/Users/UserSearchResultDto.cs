namespace SEHub.Contracts.Users;

public sealed class UserSearchResultDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string? LevelName { get; init; }
    public bool IsFollowing { get; init; }
}
