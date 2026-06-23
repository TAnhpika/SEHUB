using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserListItemDto>> GetUsersAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto> PatchUserAsync(Guid id, AdminUserPatchRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(Guid id, CancellationToken cancellationToken = default);
    Task GrantTokensAsync(Guid id, GrantTokensRequest request, CancellationToken cancellationToken = default);
}
