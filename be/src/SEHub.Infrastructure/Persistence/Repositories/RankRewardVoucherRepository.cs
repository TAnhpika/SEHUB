using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class RankRewardVoucherRepository : IRankRewardVoucherRepository
{
    private readonly SEHubDbContext _context;

    public RankRewardVoucherRepository(SEHubDbContext context) => _context = context;

    public Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers.AnyAsync(v => v.UserId == userId && v.LevelId == levelId, cancellationToken);

    public Task AddAsync(RankRewardVoucher voucher, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers.AddAsync(voucher, cancellationToken).AsTask();

    public async Task<IReadOnlyList<RankRewardVoucher>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _context.RankRewardVouchers
            .Include(v => v.Level)
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.GrantedAt)
            .ToListAsync(cancellationToken);

    public Task<RankRewardVoucher?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers
            .Include(v => v.Level)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<RankRewardVoucher> Items, int TotalCount)> ListAsync(
        string? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RankRewardVouchers
            .Include(v => v.Level)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<VoucherStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(v => v.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            var userIds = await _context.Users
                .Where(u =>
                    (u.UserName != null && u.UserName.ToLower().Contains(term))
                    || u.DisplayName.ToLower().Contains(term))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(v => userIds.Contains(v.UserId));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.GrantedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<Dictionary<string, int>> GetStatusCountsAsync(CancellationToken cancellationToken = default)
    {
        var grouped = await _context.RankRewardVouchers
            .GroupBy(v => v.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return grouped.ToDictionary(
            g => g.Status.ToString().ToLowerInvariant(),
            g => g.Count);
    }

    public async Task<bool> RevokeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var voucher = await _context.RankRewardVouchers.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (voucher is null || voucher.Status != VoucherStatus.Active)
        {
            return false;
        }

        voucher.Status = VoucherStatus.Revoked;
        voucher.UpdatedAt = DateTime.UtcNow;
        return true;
    }
}
