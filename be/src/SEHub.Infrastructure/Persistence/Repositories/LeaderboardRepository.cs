using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Gamification;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class LeaderboardRepository : ILeaderboardRepository
{
    private readonly SEHubDbContext _context;

    public LeaderboardRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetTopAsync(int take, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => !u.IsBanned)
            .OrderByDescending(u => u.Points)
            .ThenBy(u => u.UserName)
            .Take(take)
            .Select(u => new LeaderboardEntryDto
            {
                UserId = u.Id,
                Username = u.UserName ?? string.Empty,
                DisplayName = u.DisplayName,
                Points = u.Points,
                LevelName = u.Level != null ? u.Level.Name : null
            })
            .ToListAsync(cancellationToken);
    }
}
