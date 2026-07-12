using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class RoleChangeAuditRepository : IRoleChangeAuditRepository
{
    private readonly SEHubDbContext _context;

    public RoleChangeAuditRepository(SEHubDbContext context) => _context = context;

    public async Task AddAsync(RoleChangeAudit audit, CancellationToken cancellationToken = default) =>
        await _context.RoleChangeAudits.AddAsync(audit, cancellationToken);

    public async Task<(IReadOnlyList<RoleChangeAudit> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RoleChangeAudits.AsNoTracking();
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyDictionary<Guid, DateTime>> GetLatestGrantAtsByTargetIdsAsync(
        IReadOnlyCollection<Guid> targetUserIds,
        CancellationToken cancellationToken = default)
    {
        if (targetUserIds.Count == 0)
        {
            return new Dictionary<Guid, DateTime>();
        }

        var grants = await _context.RoleChangeAudits
            .AsNoTracking()
            .Where(a =>
                targetUserIds.Contains(a.TargetUserId)
                && a.Action == RoleChangeAuditActions.GrantModerator)
            .Select(a => new { a.TargetUserId, a.CreatedAt })
            .ToListAsync(cancellationToken);

        return grants
            .GroupBy(a => a.TargetUserId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.CreatedAt));
    }
}
