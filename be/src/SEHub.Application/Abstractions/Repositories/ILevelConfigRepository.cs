using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface ILevelConfigRepository
{
    Task<IReadOnlyList<LevelConfig>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    Task<LevelConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LevelConfig?> GetForPointsAsync(int points, CancellationToken cancellationToken = default);
    Task UpdateAllAsync(IReadOnlyList<LevelConfig> levels, CancellationToken cancellationToken = default);
}
