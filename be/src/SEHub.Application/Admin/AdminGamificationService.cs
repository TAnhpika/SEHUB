using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

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
        var existing = (await _levelRepository.GetAllOrderedAsync(cancellationToken)).ToList();
        var updated = new List<LevelConfig>();

        for (var i = 0; i < request.Levels.Count; i++)
        {
            var item = request.Levels[i];
            LevelConfig level;

            if (i < existing.Count)
            {
                level = existing[i];
            }
            else
            {
                level = new LevelConfig
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow
                };
                await _levelRepository.AddAsync(level, cancellationToken);
            }

            level.Name = item.Name.Trim();
            level.MinPoints = item.MinPoints;
            level.VoucherPercent = item.VoucherPercent.HasValue ? (int?)item.VoucherPercent.Value : null;
            level.UpdatedAt = DateTime.UtcNow;
            updated.Add(level);
        }

        await _levelRepository.UpdateAllAsync(updated, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var saved = await _levelRepository.GetAllOrderedAsync(cancellationToken);
        return saved.Select(MapLevel).ToList();
    }

    public async Task<IReadOnlyList<BadgeAdminDto>> GetBadgesAsync(CancellationToken cancellationToken = default)
    {
        var badges = await _badgeRepository.GetAllAsync(cancellationToken);
        var earnedCounts = await _badgeRepository.GetEarnedCountsAsync(cancellationToken);

        return badges.Select(b => MapBadge(b, earnedCounts.GetValueOrDefault(b.Id))).ToList();
    }

    public async Task<BadgeAdminDto> CreateBadgeAsync(CreateBadgeRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim().ToLowerInvariant();
        if (await _badgeRepository.GetByCodeAsync(code, cancellationToken) is not null)
        {
            throw new ForbiddenException($"Badge code '{code}' already exists.");
        }

        var badge = new Badge
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            ConditionJson = request.ConditionJson?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _badgeRepository.AddAsync(badge, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapBadge(badge, 0);
    }

    public async Task<BadgeAdminDto> UpdateBadgeAsync(Guid id, UpdateBadgeRequest request, CancellationToken cancellationToken = default)
    {
        var badge = await _badgeRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Badge", id);

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            badge.Name = request.Name.Trim();
        }

        if (request.ConditionJson is not null)
        {
            badge.ConditionJson = request.ConditionJson.Trim();
        }

        badge.UpdatedAt = DateTime.UtcNow;
        await _badgeRepository.UpdateAsync(badge, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var earnedCounts = await _badgeRepository.GetEarnedCountsAsync(cancellationToken);
        return MapBadge(badge, earnedCounts.GetValueOrDefault(badge.Id));
    }

    public async Task DeleteBadgeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var badge = await _badgeRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Badge", id);

        var earnedCounts = await _badgeRepository.GetEarnedCountsAsync(cancellationToken);
        if (earnedCounts.GetValueOrDefault(id) > 0)
        {
            throw new ForbiddenException("Cannot delete a badge that users have already earned.");
        }

        await _badgeRepository.DeleteAsync(badge, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static LevelConfigDto MapLevel(LevelConfig level) => new()
    {
        Id = level.Id,
        Name = level.Name,
        MinPoints = level.MinPoints,
        VoucherPercent = level.VoucherPercent
    };

    private static BadgeAdminDto MapBadge(Badge badge, int earnedCount) => new()
    {
        Id = badge.Id,
        Code = badge.Code,
        Name = badge.Name,
        ConditionJson = badge.ConditionJson,
        EarnedCount = earnedCount
    };
}
