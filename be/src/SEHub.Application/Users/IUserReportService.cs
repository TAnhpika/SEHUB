using SEHub.Contracts.Common;
using SEHub.Contracts.Users;

namespace SEHub.Application.Users;

public interface IUserReportService
{
    Task ReportAsync(Guid reportedUserId, ReportUserRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<UserReportDto>> GetReportsAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default);
    Task<UserReportDto> ResolveAsync(
        Guid id,
        ResolveUserReportRequest request,
        CancellationToken cancellationToken = default);
    Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);
}
