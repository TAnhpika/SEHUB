using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class RankRewardVoucherRepository : IRankRewardVoucherRepository
{
    private readonly SEHubDbContext _context;

    public RankRewardVoucherRepository(SEHubDbContext context) => _context = context;

    public Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers.AnyAsync(v => v.UserId == userId && v.LevelId == levelId, cancellationToken);

    public Task AddAsync(RankRewardVoucher voucher, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers.AddAsync(voucher, cancellationToken).AsTask();

    public Task<IReadOnlyList<RankRewardVoucher>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.RankRewardVouchers
            .Include(v => v.Level)
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.GrantedAt)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<RankRewardVoucher>)t.Result, cancellationToken);
}
