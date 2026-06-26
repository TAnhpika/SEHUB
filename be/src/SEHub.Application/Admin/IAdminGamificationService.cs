using SEHub.Application.Gamification.Abstractions;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Gamification;

namespace SEHub.Application.Admin;

public interface IAdminGamificationService
{
    Task<IReadOnlyList<LevelConfigDto>> GetLevelsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LevelConfigDto>> UpdateLevelsAsync(UpdateLevelsRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BadgeAdminDto>> GetBadgesAsync(CancellationToken cancellationToken = default);
    Task<BadgeAdminDto> CreateBadgeAsync(CreateBadgeRequest request, CancellationToken cancellationToken = default);
    Task<BadgeAdminDto> UpdateBadgeAsync(Guid id, UpdateBadgeRequest request, CancellationToken cancellationToken = default);
    Task DeleteBadgeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PointRuleDto>> GetPointRulesAsync(CancellationToken cancellationToken = default);
    Task<PointRuleDto> CreatePointRuleAsync(CreatePointRuleRequest request, CancellationToken cancellationToken = default);
    Task<PointRuleDto> UpdatePointRuleAsync(Guid id, UpdatePointRuleRequest request, CancellationToken cancellationToken = default);
    Task DeletePointRuleAsync(Guid id, CancellationToken cancellationToken = default);
}
