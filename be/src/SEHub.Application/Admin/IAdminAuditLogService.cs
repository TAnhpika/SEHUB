using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;
public interface IAdminAuditLogService
{
    Task<AdminActivityLogPageDto> GetAuditLogsAsync(
        string? type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
