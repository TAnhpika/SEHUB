namespace SEHub.Application.Abstractions;

public interface IProfileActivityCache
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default);
    void InvalidateUser(Guid userId);
}
