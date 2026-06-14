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
        // DbContext is scoped per request and not thread-safe — do not query in parallel.
        var dashboard = await _dashboardService.GetStatsAsync(cancellationToken);
        var moderation = await _moderationService.GetStatsAsync(cancellationToken);

        return new AdminOverviewDto
        {
            Dashboard = dashboard,
            Moderation = moderation,
        };
    }
}
