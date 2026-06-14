namespace SEHub.Contracts.Admin;

public sealed class AdminOverviewDto
{
    public DashboardStatsDto Dashboard { get; init; } = new();
    public ModerationStatsDto Moderation { get; init; } = new();
}
