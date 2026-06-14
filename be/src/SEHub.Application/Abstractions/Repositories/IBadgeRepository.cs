using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IBadgeRepository
{
    Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Badge?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Badge?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, int>> GetEarnedCountsAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Badge badge, CancellationToken cancellationToken = default);
    Task UpdateAsync(Badge badge, CancellationToken cancellationToken = default);
    Task DeleteAsync(Badge badge, CancellationToken cancellationToken = default);
}
