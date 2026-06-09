using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Subscription subscription, CancellationToken cancellationToken = default);
    Task UpdateAsync(Subscription subscription, CancellationToken cancellationToken = default);
    Task DeactivateAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
