namespace SEHub.Contracts.Admin;

public sealed class AdminUserDetailDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsBanned { get; init; }
    public DateTime? BanUntil { get; init; }
    public string? BanReason { get; init; }
    public string? BanType { get; init; }
    public bool IsPremium { get; init; }
    public DateTime? SubscriptionExpiresAt { get; init; }
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public int StreakCount { get; init; }
    public int AiTokensConsumedToday { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastActivityDate { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public int PostsCount { get; init; }
    public int ExamsCompleted { get; init; }
    public int ReportsFiled { get; init; }
    public int ReportsAgainst { get; init; }
}
