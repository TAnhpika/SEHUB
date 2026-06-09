namespace SEHub.Contracts.Auth;

public sealed class MeResponse
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsPremium { get; init; }
    public string? AvatarUrl { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
}
