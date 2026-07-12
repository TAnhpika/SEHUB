using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public interface IRoleChangeAuditService
{
    Task<PagedResult<RoleChangeAuditItemDto>> ListAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
