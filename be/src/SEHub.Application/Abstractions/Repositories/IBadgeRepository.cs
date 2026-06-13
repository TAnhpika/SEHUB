using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IBadgeRepository
{
    Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Badge?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
}
