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

    public Task<UserBan?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserBans
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetViolatingUserIdsPagedAsync(
        int page, int pageSize, string? search, string? status, CancellationToken cancellationToken = default)
    {
        var query = _context.UserBans
            .GroupBy(b => b.UserId)
            .Select(g => new { UserId = g.Key, LastActionAt = g.Max(x => x.CreatedAt) });

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

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLowerInvariant();
            if (normalized == "locked")
            {
                query = query.Where(x =>
                    _context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.IsBanned
                        && (u.BanUntil == null || u.BanUntil > DateTime.UtcNow)));
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
                        && (u.BanUntil == null || u.BanUntil > DateTime.UtcNow)));
            }
            else if (normalized == "normal")
            {
                query = query.Where(x =>
                    !_context.Users.Any(u =>
                        u.Id == x.UserId
                        && u.IsBanned
                        && (u.BanUntil == null || u.BanUntil > DateTime.UtcNow))
                    && !_context.UserBans.Any(b =>
                        b.UserId == x.UserId
                        && b.BanType == BanType.Warning
                        && b.CreatedAt == x.LastActionAt));
            }
        }

        var total = await query.CountAsync(cancellationToken);
        var userIds = await query
            .OrderByDescending(x => x.LastActionAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);

        return (userIds, total);
    }

    public async Task AddAsync(UserBan ban, CancellationToken cancellationToken = default) =>
        await _context.UserBans.AddAsync(ban, cancellationToken);
}
