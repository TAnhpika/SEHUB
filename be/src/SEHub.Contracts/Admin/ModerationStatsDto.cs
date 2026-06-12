namespace SEHub.Contracts.Admin;

public sealed class ModerationStatsDto
{
    public int PendingPosts { get; init; }
    public int PendingReports { get; init; }
    public int PendingPracticeSubmissions { get; init; }
    public int ActiveBans { get; init; }
}
