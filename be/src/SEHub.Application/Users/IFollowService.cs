using SEHub.Contracts.Common;
using SEHub.Contracts.Users;

namespace SEHub.Application.Users;

public interface IFollowService
{
    Task<FollowActionResultDto> FollowAsync(Guid targetUserId, CancellationToken cancellationToken = default);
    Task<FollowActionResultDto> UnfollowAsync(Guid targetUserId, CancellationToken cancellationToken = default);
    Task<FollowStatusDto> GetFollowStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default);
    Task<PagedResult<FollowUserListItemDto>> GetFollowersAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<PagedResult<FollowUserListItemDto>> GetFollowingAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FollowUserListItemDto>> GetMentionFriendsAsync(
        string? search,
        int limit,
        CancellationToken cancellationToken = default);
}
