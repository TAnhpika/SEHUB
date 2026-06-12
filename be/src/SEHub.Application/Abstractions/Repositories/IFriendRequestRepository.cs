using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IFriendRequestRepository
{
    Task<FriendRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<FriendRequest?> GetActiveBetweenUsersAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default);
    Task AddAsync(FriendRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(FriendRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(FriendRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FriendRequest>> GetPendingIncomingAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FriendRequest>> GetPendingOutgoingAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FriendRequest>> GetAcceptedForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountAcceptedForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
