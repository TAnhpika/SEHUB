using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserBanRepository
{
    Task<IReadOnlyList<UserBan>> GetActiveBansAsync(CancellationToken cancellationToken = default);
    Task<int> CountActiveBansAsync(CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserBan?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetViolatingUserIdsPagedAsync(
        int page, int pageSize, string? search, string? status, CancellationToken cancellationToken = default);
    Task AddAsync(UserBan ban, CancellationToken cancellationToken = default);
}
