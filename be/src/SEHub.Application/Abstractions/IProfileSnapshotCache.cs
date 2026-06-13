namespace SEHub.Application.Abstractions;

public interface IProfileSnapshotCache
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default);
    void InvalidateStats(Guid userId);
}
