using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Gamification;
using SEHub.Domain.Entities;

namespace SEHub.Application.Gamification;

public sealed class GamificationCatalogService : IGamificationCatalogService
{
    private readonly IBadgeRepository _badgeRepository;
    private readonly ILevelConfigRepository _levelRepository;

    public GamificationCatalogService(
        IBadgeRepository badgeRepository,
        ILevelConfigRepository levelRepository)
    {
        _badgeRepository = badgeRepository;
        _levelRepository = levelRepository;
    }

    public async Task<IReadOnlyList<BadgeCatalogItemDto>> GetBadgesAsync(CancellationToken cancellationToken = default)
    {
        var badges = await _badgeRepository.GetAllAsync(cancellationToken);
        return badges
            .Select(MapBadge)
            .OrderBy(b => b.Name)
            .ToList();
    }

    public async Task<IReadOnlyList<LevelCatalogItemDto>> GetLevelsAsync(CancellationToken cancellationToken = default)
    {
        var levels = await _levelRepository.GetAllOrderedAsync(cancellationToken);
        return levels.Select(MapLevel).ToList();
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

    private static LevelCatalogItemDto MapLevel(LevelConfig level) => new()
    {
        Id = level.Id,
        Name = level.Name,
        MinPoints = level.MinPoints,
        SortOrder = level.SortOrder,
        VoucherPercent = level.VoucherPercent,
        VoucherLabel = FormatVoucherLabel(level.VoucherPercent)
    };

    private static string? FormatVoucherLabel(int? voucherPercent) =>
        voucherPercent is > 0 ? $"Voucher FTES {voucherPercent.Value}%" : null;
}
