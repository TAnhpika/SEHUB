using SEHub.Contracts.Common;
using SEHub.Contracts.Users;

namespace SEHub.Application.Users;

public interface IUserSearchService
{
    Task<PagedResult<UserSearchResultDto>> SearchAsync(
        string query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
