namespace SEHub.Contracts.Profiles;

public sealed class ProfileStatsDto
{
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public int StreakCount { get; init; }
    public int? NextLevelPoints { get; init; }
    public string? NextLevelName { get; init; }
    public decimal ProgressPercent { get; init; }
    public int RemainingPoints { get; init; }
    public int HighestStreak { get; init; }
    public int BadgesCount { get; init; }
    public int PostsCount { get; init; }
    public int CommentsCount { get; init; }
    public int ExamsCompleted { get; init; }
}
