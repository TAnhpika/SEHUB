using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ViolationQueueRepository : IViolationQueueRepository
{
    private readonly SEHubDbContext _context;

    public ViolationQueueRepository(SEHubDbContext context) => _context = context;

    public async Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetPagedUserIdsAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        string? rank,
        string? sort,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var query = _context.Users
            .Where(u => _context.UserBans.Any(b => b.UserId == u.Id))
            .Select(u => new ViolatingUserAggregate
            {
                UserId = u.Id,
                ViolationCount = _context.UserBans.Count(b => b.UserId == u.Id),
                WarningCount = _context.UserBans.Count(b => b.UserId == u.Id && b.BanType == BanType.Warning),
                LastActionAt = _context.UserBans
                    .Where(b => b.UserId == u.Id)
                    .Select(b => b.CreatedAt)
                    .Max()
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
