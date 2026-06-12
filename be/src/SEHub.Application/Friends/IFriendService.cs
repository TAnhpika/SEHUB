using SEHub.Contracts.Common;
using SEHub.Contracts.Friends;

namespace SEHub.Application.Friends;

public interface IFriendService
{
    Task<FriendRequestDto> SendRequestAsync(Guid targetUserId, CancellationToken cancellationToken = default);
    Task<FriendRequestDto> AcceptRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    Task<FriendRequestDto> RejectRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    Task CancelRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    Task UnfriendAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FriendRequestDto>> GetRequestsAsync(
        string direction,
        CancellationToken cancellationToken = default);
    Task<PagedResult<FriendListItemDto>> GetFriendsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<FriendStatusDto> GetFriendStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default);
}
