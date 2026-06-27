using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminDashboardChartsService
{
    Task<AdminDashboardChartsDto> GetChartsAsync(string period, CancellationToken cancellationToken = default);
}
