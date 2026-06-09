using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;

namespace SEHub.Application.Admin;

public sealed class AdminGamificationService : IAdminGamificationService
{
    private readonly ILevelConfigRepository _levelRepository;
    private readonly IBadgeRepository _badgeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminGamificationService(
        ILevelConfigRepository levelRepository,
        IBadgeRepository badgeRepository,
        IUnitOfWork unitOfWork)
    {
        _levelRepository = levelRepository;
        _badgeRepository = badgeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<LevelConfigDto>> GetLevelsAsync(CancellationToken cancellationToken = default)
    {
        var levels = await _levelRepository.GetAllOrderedAsync(cancellationToken);
        return levels.Select(MapLevel).ToList();
    }

    public async Task<IReadOnlyList<LevelConfigDto>> UpdateLevelsAsync(UpdateLevelsRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _levelRepository.GetAllOrderedAsync(cancellationToken);
        var updated = new List<LevelConfig>();

        for (var i = 0; i < request.Levels.Count; i++)
        {
            var item = request.Levels[i];
            var level = i < existing.Count
                ? existing[i]
                : new LevelConfig { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };

            level.Name = item.Name;
            level.MinPoints = item.MinPoints;
            level.VoucherPercent = item.VoucherPercent.HasValue ? (int?)item.VoucherPercent.Value : null;
            level.UpdatedAt = DateTime.UtcNow;
            updated.Add(level);
        }

        await _levelRepository.UpdateAllAsync(updated, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return updated.Select(MapLevel).ToList();
    }

    public async Task<IReadOnlyList<BadgeAdminDto>> GetBadgesAsync(CancellationToken cancellationToken = default)
    {
        var badges = await _badgeRepository.GetAllAsync(cancellationToken);
        return badges.Select(b => new BadgeAdminDto
        {
            Id = b.Id,
            Code = b.Code,
            Name = b.Name,
            ConditionJson = b.ConditionJson
        }).ToList();
    }

    private static LevelConfigDto MapLevel(LevelConfig level) => new()
    {
        Id = level.Id,
        Name = level.Name,
        MinPoints = level.MinPoints,
        VoucherPercent = level.VoucherPercent
    };
}
