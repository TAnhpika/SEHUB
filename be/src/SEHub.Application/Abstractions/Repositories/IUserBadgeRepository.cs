using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserBadgeRepository
{
    Task<IReadOnlyList<UserBadge>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid userId, Guid badgeId, CancellationToken cancellationToken = default);
    Task<bool> TryGrantAsync(Guid userId, Guid badgeId, CancellationToken cancellationToken = default);
}
