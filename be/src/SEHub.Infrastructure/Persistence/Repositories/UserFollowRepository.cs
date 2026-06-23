using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class UserFollowRepository : IUserFollowRepository
{
    private readonly SEHubDbContext _context;

    public UserFollowRepository(SEHubDbContext context) => _context = context;

    public Task<UserFollow?> GetAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken = default) =>
        _context.UserFollows.FirstOrDefaultAsync(
            f => f.FollowerId == followerId && f.FollowingId == followingId,
            cancellationToken);

    public async Task AddAsync(UserFollow follow, CancellationToken cancellationToken = default)
    {
        await _context.UserFollows.AddAsync(follow, cancellationToken);
    }

    public Task RemoveAsync(UserFollow follow, CancellationToken cancellationToken = default)
    {
        _context.UserFollows.Remove(follow);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken = default) =>
        _context.UserFollows.AnyAsync(
            f => f.FollowerId == followerId && f.FollowingId == followingId,
            cancellationToken);

    public Task<int> CountFollowersAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserFollows.CountAsync(f => f.FollowingId == userId, cancellationToken);

    public Task<int> CountFollowingAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserFollows.CountAsync(f => f.FollowerId == userId, cancellationToken);

    public async Task<IReadOnlyList<Guid>> GetFollowingIdsAsync(
        Guid followerId,
        IReadOnlyList<Guid> targetUserIds,
        CancellationToken cancellationToken = default)
    {
        if (targetUserIds.Count == 0)
        {
            return Array.Empty<Guid>();
        }

        return await _context.UserFollows
            .AsNoTracking()
            .Where(f => f.FollowerId == followerId && targetUserIds.Contains(f.FollowingId))
            .Select(f => f.FollowingId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetFollowersPagedUserIdsAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _context.UserFollows
            .AsNoTracking()
            .Where(f => f.FollowingId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => f.FollowerId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetFollowingPagedUserIdsAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _context.UserFollows
            .AsNoTracking()
            .Where(f => f.FollowerId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => f.FollowingId)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountFollowersListAsync(Guid userId, CancellationToken cancellationToken = default) =>
        CountFollowersAsync(userId, cancellationToken);

    public Task<int> CountFollowingListAsync(Guid userId, CancellationToken cancellationToken = default) =>
        CountFollowingAsync(userId, cancellationToken);

    public async Task<bool> IsMutualFollowAsync(
        Guid userId,
        Guid otherUserId,
        CancellationToken cancellationToken = default)
    {
        if (userId == otherUserId)
        {
            return false;
        }

        var userFollowsOther = await ExistsAsync(userId, otherUserId, cancellationToken);
        if (!userFollowsOther)
        {
            return false;
        }

        return await ExistsAsync(otherUserId, userId, cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetMutualFriendIdsAsync(
        Guid userId,
        string? search,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var followingIds = _context.UserFollows
            .AsNoTracking()
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId);

        var mutualIds = _context.UserFollows
            .AsNoTracking()
            .Where(f => f.FollowingId == userId && followingIds.Contains(f.FollowerId))
            .Select(f => f.FollowerId);

        var query = _context.Users.AsNoTracking().Where(u => mutualIds.Contains(u.Id));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                (u.UserName != null && u.UserName.Contains(term))
                || u.DisplayName.Contains(term));
        }

        return await query
            .OrderBy(u => u.UserName)
            .Take(safeLimit)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);
    }
}
