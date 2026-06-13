using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminOverviewService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
}

public sealed class AdminOverviewService : IAdminOverviewService
{
    private readonly IAdminDashboardService _dashboardService;
    private readonly IModerationService _moderationService;

    public AdminOverviewService(IAdminDashboardService dashboardService, IModerationService moderationService)
    {
        _dashboardService = dashboardService;
        _moderationService = moderationService;
    }

    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var dashboardTask = _dashboardService.GetStatsAsync(cancellationToken);
        var moderationTask = _moderationService.GetStatsAsync(cancellationToken);
        await Task.WhenAll(dashboardTask, moderationTask);

        return new AdminOverviewDto
        {
            Dashboard = await dashboardTask,
            Moderation = await moderationTask,
        };
    }
}
