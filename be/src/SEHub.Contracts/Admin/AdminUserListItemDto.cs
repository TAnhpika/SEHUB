namespace SEHub.Contracts.Admin;

public sealed class AdminUserListItemDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsBanned { get; init; }
    public bool IsPremium { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public DateTime CreatedAt { get; init; }
}
