using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Caching;

public sealed class ProfileActivityCache : IProfileActivityCache
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromHours(1);
    private readonly IMemoryCache _cache;

    public ProfileActivityCache(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        _cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _cache.Set(key, value, ttl <= TimeSpan.Zero ? DefaultTtl : ttl);
        return Task.CompletedTask;
    }

    public void InvalidateUser(Guid userId)
    {
        for (var months = 1; months <= 12; months++)
        {
            _cache.Remove(BuildKey(userId, months));
        }
    }

    private static string BuildKey(Guid userId, int months) =>
        $"profile-activity:{userId}:{months}";
}
