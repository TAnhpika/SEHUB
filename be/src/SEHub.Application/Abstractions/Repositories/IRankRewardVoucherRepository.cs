using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IRankRewardVoucherRepository
{
    Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default);
    Task AddAsync(RankRewardVoucher voucher, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RankRewardVoucher>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<RankRewardVoucher?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<RankRewardVoucher> Items, int TotalCount)> ListAsync(
        string? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<Dictionary<string, int>> GetStatusCountsAsync(CancellationToken cancellationToken = default);
    Task<bool> RevokeAsync(Guid id, CancellationToken cancellationToken = default);
}
