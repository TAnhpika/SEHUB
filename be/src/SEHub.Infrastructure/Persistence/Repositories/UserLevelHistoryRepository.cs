using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserLevelHistoryRepository : IUserLevelHistoryRepository
{
    private readonly SEHubDbContext _context;

    public UserLevelHistoryRepository(SEHubDbContext context) => _context = context;

    public Task AddAsync(UserLevelHistory history, CancellationToken cancellationToken = default) =>
        _context.UserLevelHistories.AddAsync(history, cancellationToken).AsTask();

    public Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default) =>
        _context.UserLevelHistories.AnyAsync(h => h.UserId == userId && h.LevelId == levelId, cancellationToken);
}
