using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPointTransactionRepository
{
    Task<bool> ExistsByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default);
    Task<PointTransaction?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default);
    Task AddAsync(PointTransaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PointTransaction>> GetPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountPostedQualifyingEventsSinceAsync(
        Guid userId,
        IReadOnlyList<string> sourceTypes,
        DateTime sinceUtc,
        CancellationToken cancellationToken = default);
    Task VoidByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default);
}
