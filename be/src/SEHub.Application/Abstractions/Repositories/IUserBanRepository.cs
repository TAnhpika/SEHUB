using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserBanRepository
{
    Task<IReadOnlyList<UserBan>> GetActiveBansAsync(CancellationToken cancellationToken = default);
    Task<int> CountActiveBansAsync(CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAndTypeAsync(Guid userId, BanType banType, CancellationToken cancellationToken = default);
    Task<UserBan?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserBan>> GetHistoryByUserIdAsync(
        Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountHistoryByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountDistinctViolatingUsersAsync(CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetViolatingUserIdsPagedAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        string? rank,
        string? sort,
        CancellationToken cancellationToken = default);
    Task AddAsync(UserBan ban, CancellationToken cancellationToken = default);
}
