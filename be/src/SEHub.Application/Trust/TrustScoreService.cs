using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Trust;

namespace SEHub.Application.Trust;

public interface ITrustScoreService
{
    Task<TrustScoreDto> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    void InvalidateCache(Guid userId);
}

public sealed class TrustScoreService : ITrustScoreService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(15);

    private readonly ITrustSignalReadRepository _signalRepository;
    private readonly TrustScoreCalculator _calculator;
    private readonly IMemoryCache _cache;

    public TrustScoreService(
        ITrustSignalReadRepository signalRepository,
        TrustScoreCalculator calculator,
        IMemoryCache cache)
    {
        _signalRepository = signalRepository;
        _calculator = calculator;
        _cache = cache;
    }

    public async Task<TrustScoreDto> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = BuildCacheKey(userId);
        if (_cache.TryGetValue(cacheKey, out TrustScoreDto? cached) && cached is not null)
        {
            return cached;
        }

        var signals = await _signalRepository.GetSignalsAsync(userId, cancellationToken);
        var result = _calculator.Compute(signals, DateTime.UtcNow);
        _cache.Set(cacheKey, result, CacheTtl);
        return result;
    }

    public void InvalidateCache(Guid userId) => _cache.Remove(BuildCacheKey(userId));

    private static string BuildCacheKey(Guid userId) => $"trust-score:{userId}";
}
