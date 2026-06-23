using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Caching;

public sealed class ProfileSnapshotCache : IProfileSnapshotCache
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(15);
    private readonly IMemoryCache _cache;

    public ProfileSnapshotCache(IMemoryCache cache)
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

    public void InvalidateStats(Guid userId)
    {
        _cache.Remove(BuildStatsKey(userId));
    }

    public static string BuildStatsKey(Guid userId) => $"profile:stats:{userId}";
}
