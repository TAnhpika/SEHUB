using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IRewardRuleRepository
{
    Task<IReadOnlyList<RewardRule>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<RewardRule?> GetByLevelIdAsync(Guid levelId, CancellationToken cancellationToken = default);
    Task<RewardRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(RewardRule rule, CancellationToken cancellationToken = default);
    Task UpdateAsync(RewardRule rule, CancellationToken cancellationToken = default);
    Task DeleteAsync(RewardRule rule, CancellationToken cancellationToken = default);
}
