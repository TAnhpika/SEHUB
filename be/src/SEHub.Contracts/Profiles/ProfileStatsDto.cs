namespace SEHub.Contracts.Profiles;

public sealed class ProfileStatsDto
{
    public int Points { get; init; }
    public string? LevelName { get; init; }
    public int StreakCount { get; init; }
    public int? NextLevelPoints { get; init; }
    public int BadgesCount { get; init; }
}
