using SEHub.Application.Models;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserSearchRepository
{
    Task<IReadOnlyList<UserSearchRow>> SearchAsync(
        string search,
        int page,
        int pageSize,
        Guid? excludeUserId = null,
        CancellationToken cancellationToken = default);

    Task<int> CountAsync(
        string search,
        Guid? excludeUserId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserSearchRow>> GetByIdsAsync(
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken = default);
}
