using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SubscriptionPlan>> GetAllAsync(CancellationToken cancellationToken = default);
}
