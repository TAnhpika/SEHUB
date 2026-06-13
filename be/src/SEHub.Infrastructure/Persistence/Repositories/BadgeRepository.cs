using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class BadgeRepository : IBadgeRepository
{
    private readonly SEHubDbContext _context;

    public BadgeRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Badges.OrderBy(b => b.Name).ToListAsync(cancellationToken);

    public Task<Badge?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.Badges.FirstOrDefaultAsync(b => b.Code == code, cancellationToken);
}
