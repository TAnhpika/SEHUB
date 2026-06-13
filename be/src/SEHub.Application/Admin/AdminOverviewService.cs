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
        // Sequential: dashboard + moderation share scoped DbContext — parallel calls cause EF errors.
        var dashboard = await _dashboardService.GetStatsAsync(cancellationToken);
        var moderation = await _moderationService.GetStatsAsync(cancellationToken);

        return new AdminOverviewDto
        {
            Dashboard = dashboard,
            Moderation = moderation,
        };
    }
}
