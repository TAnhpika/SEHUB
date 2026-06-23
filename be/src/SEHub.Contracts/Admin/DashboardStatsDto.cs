namespace SEHub.Contracts.Admin;

public sealed class DashboardStatsDto
{
    public int TotalUsers { get; init; }
    public int TotalPosts { get; init; }
    public int TotalExams { get; init; }
    public int PendingReports { get; init; }
    public decimal TotalRevenue { get; init; }
    public int ActiveSubscriptions { get; init; }
    public int TotalDocuments { get; init; }
}
