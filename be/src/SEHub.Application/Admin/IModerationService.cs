using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public interface IModerationService
{
    Task<PagedResult<ReportDto>> GetReportsAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<ReportDto> GetReportAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReportDto> ResolveReportAsync(Guid id, ResolveReportRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BannedUserDto>> GetBannedUsersAsync(CancellationToken cancellationToken = default);
}
