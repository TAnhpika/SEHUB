using Microsoft.Extensions.Caching.Memory;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;



namespace SEHub.Infrastructure.Identity;



public sealed class PremiumStatusService : IPremiumStatusService

{

    public const string CacheKeyPrefix = "premium:";

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(3);



    private readonly ISubscriptionRepository _subscriptionRepository;

    private readonly IMemoryCache _cache;



    public PremiumStatusService(ISubscriptionRepository subscriptionRepository, IMemoryCache cache)

    {

        _subscriptionRepository = subscriptionRepository;

        _cache = cache;

    }



    public async Task<bool> IsPremiumAsync(Guid userId, CancellationToken cancellationToken = default)

    {

        var cacheKey = $"{CacheKeyPrefix}{userId}";

        if (_cache.TryGetValue(cacheKey, out bool isPremium))

        {

            return isPremium;

        }



        var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);

        isPremium = subscription is not null && subscription.IsActive && subscription.EndAt > DateTime.UtcNow;

        _cache.Set(cacheKey, isPremium, CacheDuration);

        return isPremium;

    }



    public void InvalidateCache(Guid userId) =>

        _cache.Remove($"{CacheKeyPrefix}{userId}");

}

