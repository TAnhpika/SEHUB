using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminGamificationService
{
    Task<IReadOnlyList<LevelConfigDto>> GetLevelsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LevelConfigDto>> UpdateLevelsAsync(UpdateLevelsRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BadgeAdminDto>> GetBadgesAsync(CancellationToken cancellationToken = default);
    Task<BadgeAdminDto> CreateBadgeAsync(CreateBadgeRequest request, CancellationToken cancellationToken = default);
    Task<BadgeAdminDto> UpdateBadgeAsync(Guid id, UpdateBadgeRequest request, CancellationToken cancellationToken = default);
    Task DeleteBadgeAsync(Guid id, CancellationToken cancellationToken = default);
}
