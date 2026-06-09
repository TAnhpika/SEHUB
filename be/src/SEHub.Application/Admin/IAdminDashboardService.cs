using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
}
