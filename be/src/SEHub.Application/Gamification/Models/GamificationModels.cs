namespace SEHub.Application.Gamification.Models;

public sealed class PointAwardResult
{
    public bool Applied { get; init; }
    public int Amount { get; init; }
    public int TotalPoints { get; init; }
    public string? RuleCode { get; init; }
}

public sealed class LevelSnapshot
{
    public Guid? LevelId { get; init; }
    public string? LevelName { get; init; }
    public int Points { get; init; }
    public bool LevelChanged { get; init; }
    public Guid? PreviousLevelId { get; init; }
    public int? NextLevelPoints { get; init; }
    public string? NextLevelName { get; init; }
    public decimal ProgressPercent { get; init; }
    public int RemainingPoints { get; init; }
}

public sealed class StreakSnapshot
{
    public int CurrentStreak { get; init; }
    public int HighestStreak { get; init; }
    public bool WasIncremented { get; init; }
    public bool MilestoneReached { get; init; }
}

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
