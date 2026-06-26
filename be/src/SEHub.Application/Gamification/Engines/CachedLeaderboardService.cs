using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Contracts.Gamification;

namespace SEHub.Application.Gamification.Engines;

public sealed class CachedLeaderboardService : ILeaderboardService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private readonly LeaderboardService _inner;
    private readonly IMemoryCache _cache;
    private readonly GamificationSettings _settings;

    public CachedLeaderboardService(
        LeaderboardService inner,
        IMemoryCache cache,
        IOptions<GamificationSettings> settings)
    {
        _inner = inner;
        _cache = cache;
        _settings = settings.Value;
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetTopAsync(int take, CancellationToken cancellationToken = default)
    {
        if (!_settings.UseRedisCache)
        {
            return await _inner.GetTopAsync(take, cancellationToken);
        }

        var cacheKey = $"gamification:leaderboard:top:{take}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<LeaderboardEntryDto>? cached) && cached is not null)
        {
            return cached;
        }

        var result = await _inner.GetTopAsync(take, cancellationToken);
        _cache.Set(cacheKey, result, CacheDuration);
        return result;
    }
}
