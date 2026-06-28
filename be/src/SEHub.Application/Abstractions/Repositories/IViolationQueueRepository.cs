namespace SEHub.Application.Abstractions.Repositories;

public interface IViolationQueueRepository
{
    Task<(IReadOnlyList<Guid> UserIds, int TotalCount)> GetPagedUserIdsAsync(
        int page,
        int pageSize,
        string? search,
        string? status,
        string? rank,
        string? sort,
        CancellationToken cancellationToken = default);
}
