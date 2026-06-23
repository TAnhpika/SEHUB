using SEHub.Contracts.Gamification;

namespace SEHub.Application.Gamification;

public interface IGamificationCatalogService
{
    Task<IReadOnlyList<BadgeCatalogItemDto>> GetBadgesAsync(CancellationToken cancellationToken = default);
}
