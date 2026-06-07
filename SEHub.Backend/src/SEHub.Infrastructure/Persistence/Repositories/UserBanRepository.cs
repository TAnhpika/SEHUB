using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserBanRepository : IUserBanRepository
{
    private readonly SEHubDbContext _context;

    public UserBanRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<UserBan>> GetActiveBansAsync(CancellationToken cancellationToken = default) =>
        await _context.UserBans
            .Where(b => b.BanType != BanType.Warning && (b.Until == null || b.Until > DateTime.UtcNow))
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(UserBan ban, CancellationToken cancellationToken = default) =>
        await _context.UserBans.AddAsync(ban, cancellationToken);
}
