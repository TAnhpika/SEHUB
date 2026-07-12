using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IRoleChangeAuditRepository
{
    Task AddAsync(RoleChangeAudit audit, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<RoleChangeAudit> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, DateTime>> GetLatestGrantAtsByTargetIdsAsync(
        IReadOnlyCollection<Guid> targetUserIds,
        CancellationToken cancellationToken = default);
}
