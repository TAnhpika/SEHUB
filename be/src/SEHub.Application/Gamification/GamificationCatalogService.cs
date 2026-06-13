using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Gamification;
using SEHub.Domain.Entities;

namespace SEHub.Application.Gamification;

public sealed class GamificationCatalogService : IGamificationCatalogService
{
    private readonly IBadgeRepository _badgeRepository;

    public GamificationCatalogService(IBadgeRepository badgeRepository)
    {
        _badgeRepository = badgeRepository;
    }

    public async Task<IReadOnlyList<BadgeCatalogItemDto>> GetBadgesAsync(CancellationToken cancellationToken = default)
    {
        var badges = await _badgeRepository.GetAllAsync(cancellationToken);
        return badges
            .Select(MapBadge)
            .OrderBy(b => b.Name)
            .ToList();
    }

    internal static BadgeCatalogItemDto MapBadge(Badge badge)
    {
        var condition = BadgeCondition.TryParse(badge.ConditionJson);
        return new BadgeCatalogItemDto
        {
            Id = badge.Id,
            Code = badge.Code,
            Name = badge.Name,
            Description = condition?.Description ?? badge.Name
        };
    }
}
