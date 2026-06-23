using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserBlockRepository
{
    Task<UserBlock?> GetAsync(
        Guid blockerId,
        Guid blockedUserId,
        CancellationToken cancellationToken = default);

    Task<bool> IsBlockedEitherWayAsync(
        Guid userA,
        Guid userB,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> GetBlockedRelatedUserIdsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task AddAsync(UserBlock block, CancellationToken cancellationToken = default);

    Task RemoveAsync(UserBlock block, CancellationToken cancellationToken = default);
}
