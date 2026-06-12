using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class UserSearchRepository : IUserSearchRepository
{
    private readonly SEHubDbContext _context;

    public UserSearchRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<UserSearchRow>> SearchAsync(
        string search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(search);

        var rows = await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserSearchRow
            {
                UserId = u.Id,
                Username = u.UserName ?? string.Empty,
                FullName = u.DisplayName,
                AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null,
                LevelName = u.Level != null ? u.Level.Name : null
            })
            .ToListAsync(cancellationToken);

        return rows;
    }

    public Task<int> CountAsync(string search, CancellationToken cancellationToken = default) =>
        BuildQuery(search).CountAsync(cancellationToken);

    public async Task<IReadOnlyList<UserSearchRow>> GetByIdsAsync(
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        if (userIds.Count == 0)
        {
            return Array.Empty<UserSearchRow>();
        }

        var rows = await _context.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id) && !u.IsBanned)
            .Select(u => new UserSearchRow
            {
                UserId = u.Id,
                Username = u.UserName ?? string.Empty,
                FullName = u.DisplayName,
                AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null,
                LevelName = u.Level != null ? u.Level.Name : null
            })
            .ToListAsync(cancellationToken);

        var order = userIds.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
        return rows.OrderBy(r => order.GetValueOrDefault(r.UserId, int.MaxValue)).ToList();
    }

    private IQueryable<ApplicationUser> BuildQuery(string search)
    {
        var query = _context.Users
            .AsNoTracking()
            .Where(u => !u.IsBanned);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                (u.UserName != null && u.UserName.ToLower().Contains(term)) ||
                u.DisplayName.ToLower().Contains(term));
        }

        return query;
    }
}
