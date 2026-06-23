using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserFollowRepository
{
    Task<UserFollow?> GetAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken = default);
    Task AddAsync(UserFollow follow, CancellationToken cancellationToken = default);
    Task RemoveAsync(UserFollow follow, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken = default);
    Task<int> CountFollowersAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountFollowingAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetFollowingIdsAsync(
        Guid followerId,
        IReadOnlyList<Guid> targetUserIds,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetFollowersPagedUserIdsAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetFollowingPagedUserIdsAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountFollowersListAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountFollowingListAsync(Guid userId, CancellationToken cancellationToken = default);
}
