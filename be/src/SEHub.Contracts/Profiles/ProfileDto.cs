namespace SEHub.Contracts.Profiles;

public sealed class ProfileDto
{
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? Bio { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Major { get; init; }
    public string? Semester { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public IReadOnlyList<BadgeDto> Badges { get; init; } = [];
}
