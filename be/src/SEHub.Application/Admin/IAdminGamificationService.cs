using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminGamificationService
{
    Task<IReadOnlyList<LevelConfigDto>> GetLevelsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LevelConfigDto>> UpdateLevelsAsync(UpdateLevelsRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BadgeAdminDto>> GetBadgesAsync(CancellationToken cancellationToken = default);
}
