using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IRankRewardVoucherRepository
{
    Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default);
    Task AddAsync(RankRewardVoucher voucher, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RankRewardVoucher>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
