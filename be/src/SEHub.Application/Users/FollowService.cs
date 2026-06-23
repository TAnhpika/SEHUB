using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Contracts.Common;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Users;

public sealed class FollowService : IFollowService
{
    private const int MaxPageSize = 50;

    private readonly IUserFollowRepository _followRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserSearchRepository _searchRepository;
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public FollowService(
        IUserFollowRepository followRepository,
        IUserRepository userRepository,
        IUserSearchRepository searchRepository,
        INotificationService notificationService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _followRepository = followRepository;
        _userRepository = userRepository;
        _searchRepository = searchRepository;
        _notificationService = notificationService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<FollowActionResultDto> FollowAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var followerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);
        ValidateNotSelf(followerId, targetUserId);

        var existing = await _followRepository.GetAsync(followerId, targetUserId, cancellationToken);
        if (existing is null)
        {
            await _followRepository.AddAsync(new UserFollow
            {
                FollowerId = followerId,
                FollowingId = targetUserId,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var followerSummary = (await _searchRepository.GetByIdsAsync([followerId], cancellationToken)).FirstOrDefault();
            var followerName = followerSummary?.FullName ?? followerSummary?.Username ?? "Ai đó";

            await _notificationService.CreateAsync(
                targetUserId,
                NotificationType.Follow,
                $"{followerName} đã theo dõi bạn",
                linkUrl: followerSummary is not null ? $"/profile/{followerSummary.Username}" : null,
                actorUserId: followerId,
                referenceId: followerId,
                cancellationToken: cancellationToken);
        }

        return await BuildActionResultAsync(followerId, targetUserId, isFollowing: true, cancellationToken);
    }

    public async Task<FollowActionResultDto> UnfollowAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var followerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);
        ValidateNotSelf(followerId, targetUserId);

        var existing = await _followRepository.GetAsync(followerId, targetUserId, cancellationToken);
        if (existing is not null)
        {
            await _followRepository.RemoveAsync(existing, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return await BuildActionResultAsync(followerId, targetUserId, isFollowing: false, cancellationToken);
    }

    public async Task<FollowStatusDto> GetFollowStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var viewerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);

        var isFollowing = viewerId == targetUserId
            ? false
            : await _followRepository.ExistsAsync(viewerId, targetUserId, cancellationToken);

        var followersCount = await _followRepository.CountFollowersAsync(targetUserId, cancellationToken);
        var followingCount = await _followRepository.CountFollowingAsync(targetUserId, cancellationToken);

        return new FollowStatusDto
        {
            IsFollowing = isFollowing,
            FollowersCount = followersCount,
            FollowingCount = followingCount
        };
    }

    public async Task<PagedResult<FollowUserListItemDto>> GetFollowersAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(userId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var total = await _followRepository.CountFollowersListAsync(userId, cancellationToken);
        var followerIds = await _followRepository.GetFollowersPagedUserIdsAsync(userId, page, pageSize, cancellationToken);
        var items = await MapFollowListItemsAsync(followerIds, cancellationToken);

        return new PagedResult<FollowUserListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PagedResult<FollowUserListItemDto>> GetFollowingAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(userId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var total = await _followRepository.CountFollowingListAsync(userId, cancellationToken);
        var followingIds = await _followRepository.GetFollowingPagedUserIdsAsync(userId, page, pageSize, cancellationToken);
        var items = await MapFollowListItemsAsync(followingIds, cancellationToken);

        return new PagedResult<FollowUserListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    private async Task<IReadOnlyList<FollowUserListItemDto>> MapFollowListItemsAsync(
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return Array.Empty<FollowUserListItemDto>();
        }

        var viewerId = _currentUser.UserId;
        var rows = await _searchRepository.GetByIdsAsync(userIds, cancellationToken);
        IReadOnlySet<Guid> followingIds = new HashSet<Guid>();

        if (viewerId.HasValue)
        {
            var ids = rows.Select(r => r.UserId).ToList();
            var following = await _followRepository.GetFollowingIdsAsync(viewerId.Value, ids, cancellationToken);
            followingIds = following.ToHashSet();
        }

        return rows.Select(row => new FollowUserListItemDto
        {
            UserId = row.UserId,
            Username = row.Username,
            FullName = row.FullName,
            AvatarUrl = row.AvatarUrl,
            LevelName = row.LevelName,
            IsFollowing = viewerId.HasValue && followingIds.Contains(row.UserId)
        }).ToList();
    }

    private async Task<FollowActionResultDto> BuildActionResultAsync(
        Guid followerId,
        Guid targetUserId,
        bool isFollowing,
        CancellationToken cancellationToken)
    {
        var followersCount = await _followRepository.CountFollowersAsync(targetUserId, cancellationToken);
        var followingCount = await _followRepository.CountFollowingAsync(targetUserId, cancellationToken);

        return new FollowActionResultDto
        {
            IsFollowing = isFollowing,
            FollowersCount = followersCount,
            FollowingCount = followingCount
        };
    }

    private async Task EnsureTargetUserExistsAsync(Guid targetUserId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (user is null || user.IsBanned)
        {
            throw new NotFoundException("User", targetUserId);
        }
    }

    private static void ValidateNotSelf(Guid followerId, Guid targetUserId)
    {
        if (followerId == targetUserId)
        {
            throw new DomainException("You cannot follow yourself.");
        }
    }
}
