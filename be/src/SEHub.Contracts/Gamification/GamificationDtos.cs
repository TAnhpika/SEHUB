namespace SEHub.Contracts.Gamification;

public sealed class GamificationProfileDto
{
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public string? NextLevelName { get; init; }
    public int? NextLevelPoints { get; init; }
    public decimal ProgressPercent { get; init; }
    public int RemainingPoints { get; init; }
    public int CurrentStreak { get; init; }
    public int HighestStreak { get; init; }
}

public sealed class PointRuleDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string EventType { get; init; } = string.Empty;
    public int Points { get; init; }
    public bool IsActive { get; init; }
    public string? Description { get; init; }
}

public sealed class CreatePointRuleRequest
{
    public string Code { get; init; } = string.Empty;
    public string EventType { get; init; } = string.Empty;
    public int Points { get; init; }
    public bool IsActive { get; init; } = true;
    public string? Description { get; init; }
}

public sealed class UpdatePointRuleRequest
{
    public string EventType { get; init; } = string.Empty;
    public int Points { get; init; }
    public bool IsActive { get; init; }
    public string? Description { get; init; }
}

public sealed class RankRewardVoucherDto
{
    public Guid Id { get; init; }
    public string? LevelName { get; init; }
    public int DiscountPercent { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public DateTime GrantedAt { get; init; }
}

public sealed class LeaderboardEntryDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public int Points { get; init; }
    public string? LevelName { get; init; }
}
