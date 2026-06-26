using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPointRuleRepository
{
    Task<IReadOnlyList<PointRule>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PointRule>> GetActiveByEventTypeAsync(string eventType, CancellationToken cancellationToken = default);
    Task<PointRule?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<PointRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(PointRule rule, CancellationToken cancellationToken = default);
    Task UpdateAsync(PointRule rule, CancellationToken cancellationToken = default);
    Task DeleteAsync(PointRule rule, CancellationToken cancellationToken = default);
}
