using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IViolationEscalationRepository
{
    Task<ViolationEscalation?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(ViolationEscalation escalation, CancellationToken cancellationToken = default);
    Task UpdateAsync(ViolationEscalation escalation, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetDistinctUserIdsAsync(CancellationToken cancellationToken = default);
}
