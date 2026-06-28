using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Users;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Users;

public sealed class UserSearchService : IUserSearchService
{
    private const int MaxPageSize = 50;

    private readonly IUserSearchRepository _searchRepository;
    private readonly IUserFollowRepository _followRepository;
    private readonly ICurrentUserService _currentUser;

    public UserSearchService(
        IUserSearchRepository searchRepository,
        IUserFollowRepository followRepository,
        ICurrentUserService currentUser)
    {
        _searchRepository = searchRepository;
        _followRepository = followRepository;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<UserSearchResultDto>> SearchAsync(
        string query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }

        if (string.IsNullOrWhiteSpace(query))
        {
            throw new DomainException("Search query is required.");
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var trimmedQuery = query.Trim();
        var viewerId = _currentUser.UserId;
        var total = await _searchRepository.CountAsync(trimmedQuery, viewerId, cancellationToken);
        var rows = await _searchRepository.SearchAsync(trimmedQuery, page, pageSize, viewerId, cancellationToken);

        IReadOnlySet<Guid> followingIds = new HashSet<Guid>();
        if (viewerId.HasValue && rows.Count > 0)
        {
            var ids = rows.Select(r => r.UserId).ToList();
            var following = await _followRepository.GetFollowingIdsAsync(viewerId.Value, ids, cancellationToken);
            followingIds = following.ToHashSet();
        }

        var items = rows.Select(row => new UserSearchResultDto
        {
            UserId = row.UserId,
            Username = row.Username,
            FullName = row.FullName,
            AvatarUrl = row.AvatarUrl,
            LevelName = row.LevelName,
            IsFollowing = viewerId.HasValue && followingIds.Contains(row.UserId)
        }).ToList();

        return new PagedResult<UserSearchResultDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }
}
