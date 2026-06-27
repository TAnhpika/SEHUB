using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public interface IAdminAuditLogService
{
    Task<PagedResult<AdminAuditLogItemDto>> GetAuditLogsAsync(
        string? type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
