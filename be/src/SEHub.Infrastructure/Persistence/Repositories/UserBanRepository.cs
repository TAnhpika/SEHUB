using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserBanRepository : IUserBanRepository
{
    private readonly SEHubDbContext _context;

    public UserBanRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<UserBan>> GetActiveBansAsync(CancellationToken cancellationToken = default) =>
        await _context.UserBans
            .Where(b => b.BanType != BanType.Warning && (b.Until == null || b.Until > DateTime.UtcNow))
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountActiveBansAsync(CancellationToken cancellationToken = default) =>
        _context.UserBans.CountAsync(
            b => b.BanType != BanType.Warning && (b.Until == null || b.Until > DateTime.UtcNow),
            cancellationToken);

    public Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBans.CountAsync(b => b.UserId == userId, cancellationToken);

    public Task<int> CountByUserIdAndTypeAsync(Guid userId, BanType banType, CancellationToken cancellationToken = default) =>
        _context.UserBans.CountAsync(b => b.UserId == userId && b.BanType == banType, cancellationToken);

    public Task<UserBan?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBans
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<UserBan?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBans.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, cancellationToken);

    public async Task<UserBan?> GetLatestByUserIdAndTypeAsync(
        Guid userId,
        BanType? banType,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserBans.Where(b => b.UserId == userId);
        if (banType.HasValue)
        {
            query = query.Where(b => b.BanType == banType.Value);
        }

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UserBan>> GetHistoryByUserIdAsync(
        Guid userId, int page, int pageSize, CancellationToken cancellationToken = default) =>
        await _context.UserBans
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

    public Task<int> CountHistoryByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBans.CountAsync(b => b.UserId == userId, cancellationToken);

    public Task<int> CountDistinctViolatingUsersAsync(CancellationToken cancellationToken = default) =>
        _context.UserBans.Select(b => b.UserId).Distinct().CountAsync(cancellationToken);

    public async Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetViolatingUserIdsPagedAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        string? rank,
        string? sort,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var query = _context.UserBans
            .GroupBy(b => b.UserId)
            .Select(g => new ViolatingUserAggregate
            {
                UserId = g.Key,
                ViolationCount = g.Count(),
                WarningCount = g.Count(x => x.BanType == BanType.Warning),
                LastActionAt = g.Max(x => x.CreatedAt)
            });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                _context.Users.Any(u =>
                    u.Id == x.UserId
                    && (u.UserName!.Contains(term)
                        || u.Email!.Contains(term)
                        || u.DisplayName!.Contains(term))));
        }

        if (!string.IsNullOrWhiteSpace(rank) && !string.Equals(rank, "all", StringComparison.OrdinalIgnoreCase))
        {
            var rankName = MapRankFilter(rank);
            if (!string.IsNullOrWhiteSpace(rankName))
            {
                query = query.Where(x =>
                    _context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.LevelId != null
                        && _context.LevelConfigs.Any(l =>
                            l.Id == u.LevelId
                            && l.Name == rankName)));
            }
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var normalized = status.Trim().ToLowerInvariant();
            if (normalized == "locked")
            {
                query = query.Where(x =>
                    _context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.IsBanned
                        && (u.BanUntil == null || u.BanUntil > now)));
            }
            else if (normalized == "warning")
            {
                query = query.Where(x =>
                    _context.UserBans.Any(b =>
                        b.UserId == x.UserId
                        && b.BanType == BanType.Warning
                        && b.CreatedAt == x.LastActionAt)
                    && !_context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.IsBanned
                        && (u.BanUntil == null || u.BanUntil > now)));
            }
            else if (normalized == "normal")
            {
                query = query.Where(x =>
                    !_context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.IsBanned
                        && (u.BanUntil == null || u.BanUntil > now))
                    && !_context.UserBans.Any(b =>
                        b.UserId == x.UserId
                        && b.BanType == BanType.Warning
                        && b.CreatedAt == x.LastActionAt));
            }
        }

        query = ApplySort(query, sort, _context);

        var total = await query.CountAsync(cancellationToken);
        var userIds = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);

        return (userIds, total);
    }

    public async Task AddAsync(UserBan ban, CancellationToken cancellationToken = default) =>
        await _context.UserBans.AddAsync(ban, cancellationToken);

    private static IQueryable<ViolatingUserAggregate> ApplySort(
        IQueryable<ViolatingUserAggregate> query,
        string? sort,
        SEHubDbContext context)
    {
        return (sort?.Trim().ToLowerInvariant()) switch
        {
            "violations-asc" => query.OrderBy(x => x.ViolationCount).ThenByDescending(x => x.LastActionAt),
            "name-asc" => query
                .OrderBy(x => context.Users.Where(u => u.Id == x.UserId).Select(u => u.DisplayName).FirstOrDefault())
                .ThenBy(x => context.Users.Where(u => u.Id == x.UserId).Select(u => u.UserName).FirstOrDefault()),
            _ => query.OrderByDescending(x => x.ViolationCount).ThenByDescending(x => x.LastActionAt)
        };
    }

    private static string? MapRankFilter(string rank) =>
        rank.Trim().ToLowerInvariant() switch
        {
            "bronze" => "Bronze",
            "silver" => "Silver",
            "gold" => "Gold",
            "platinum" => "Platinum",
            _ => null
        };

    private sealed class ViolatingUserAggregate
    {
        public Guid UserId { get; init; }
        public int ViolationCount { get; init; }
        public int WarningCount { get; init; }
        public DateTime LastActionAt { get; init; }
    }
}
