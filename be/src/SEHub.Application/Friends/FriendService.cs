using SEHub.Contracts.Common;
using SEHub.Contracts.Friends;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Friends;

public sealed class FriendService : IFriendService
{
    private const string DisabledMessage = "Friends feature is disabled.";

    public Task<FriendRequestDto> SendRequestAsync(Guid targetUserId, CancellationToken cancellationToken = default) =>
        Disabled<FriendRequestDto>();

    public Task<FriendRequestDto> AcceptRequestAsync(Guid requestId, CancellationToken cancellationToken = default) =>
        Disabled<FriendRequestDto>();

    public Task<FriendRequestDto> RejectRequestAsync(Guid requestId, CancellationToken cancellationToken = default) =>
        Disabled<FriendRequestDto>();

    public Task CancelRequestAsync(Guid requestId, CancellationToken cancellationToken = default) =>
        Disabled();

    public Task UnfriendAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Disabled();

    public Task<IReadOnlyList<FriendRequestDto>> GetRequestsAsync(
        string direction,
        CancellationToken cancellationToken = default) =>
        Disabled<IReadOnlyList<FriendRequestDto>>();

    public Task<PagedResult<FriendListItemDto>> GetFriendsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        Disabled<PagedResult<FriendListItemDto>>();

    public Task<FriendStatusDto> GetFriendStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default) =>
        Disabled<FriendStatusDto>();

    private static Task Disabled() => throw new ForbiddenException(DisabledMessage);

    private static Task<T> Disabled<T>() => throw new ForbiddenException(DisabledMessage);
}
