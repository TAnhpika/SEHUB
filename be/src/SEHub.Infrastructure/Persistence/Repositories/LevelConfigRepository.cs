using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class LevelConfigRepository : ILevelConfigRepository
{
    private readonly SEHubDbContext _context;

    public LevelConfigRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<LevelConfig>> GetAllOrderedAsync(CancellationToken cancellationToken = default) =>
        await _context.LevelConfigs.OrderBy(l => l.MinPoints).ToListAsync(cancellationToken);

    public Task<LevelConfig?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.LevelConfigs.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

    public Task<LevelConfig?> GetForPointsAsync(int points, CancellationToken cancellationToken = default) =>
        _context.LevelConfigs
            .Where(l => l.MinPoints <= points)
            .OrderByDescending(l => l.MinPoints)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task UpdateAllAsync(IReadOnlyList<LevelConfig> levels, CancellationToken cancellationToken = default)
    {
        _context.LevelConfigs.UpdateRange(levels);
        await Task.CompletedTask;
    }

    public async Task AddAsync(LevelConfig level, CancellationToken cancellationToken = default) =>
        await _context.LevelConfigs.AddAsync(level, cancellationToken);
}
