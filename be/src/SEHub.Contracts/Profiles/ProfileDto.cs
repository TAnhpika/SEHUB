namespace SEHub.Contracts.Profiles;

public sealed class ProfileDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? Bio { get; init; }
    public string? AvatarUrl { get; init; }
    public string? Gender { get; init; }
    public string? DateOfBirth { get; init; }
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public string? Major { get; init; }
    public string? Semester { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public IReadOnlyList<BadgeDto> Badges { get; init; } = [];
    public int FollowersCount { get; init; }
    public int FollowingCount { get; init; }
    public bool? IsFollowing { get; init; }
    public DateTime MemberSince { get; init; }
    public DateTime? ProfileUpdatedAt { get; init; }
}
