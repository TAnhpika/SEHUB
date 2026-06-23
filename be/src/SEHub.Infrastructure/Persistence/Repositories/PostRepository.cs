using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PostRepository : IPostRepository
{
    private readonly SEHubDbContext _context;

    public PostRepository(SEHubDbContext context) => _context = context;

    public Task<Post?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Posts.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<Post?> GetByIdIncludingDeletedAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Posts.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedAsync(PostQueryParams query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Posts.Where(p => p.Status == PostStatus.Published);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            dbQuery = dbQuery.Where(p => p.Title.Contains(term) || p.Content.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var tag = query.Tag.Trim();
            dbQuery = dbQuery.Where(p => p.Tags.Contains(tag));
        }

        if (!string.IsNullOrWhiteSpace(query.Major))
        {
            var major = query.Major.Trim();
            dbQuery = dbQuery.Where(p =>
                _context.UserProfiles.Any(up => up.UserId == p.AuthorId && up.Major == major));
        }

        if (!string.IsNullOrWhiteSpace(query.Semester) && int.TryParse(query.Semester.Trim(), out var semester))
        {
            dbQuery = dbQuery.Where(p =>
                _context.UserProfiles.Any(up => up.UserId == p.AuthorId && up.Semester == semester));
        }

        if (query.IsFeatured is true)
        {
            dbQuery = dbQuery.Where(p => p.IsFeatured);
        }
        else if (query.IsFeatured is false)
        {
            dbQuery = dbQuery.Where(p => !p.IsFeatured);
        }

        var sortDescending = !string.Equals(query.SortDir, "asc", StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<Post> orderedQuery = dbQuery
            .OrderByDescending(p => p.IsPinned);

        orderedQuery = (query.SortBy?.Trim().ToLowerInvariant()) switch
        {
            "title" => sortDescending
                ? orderedQuery.ThenByDescending(p => p.Title)
                : orderedQuery.ThenBy(p => p.Title),
            _ => sortDescending
                ? orderedQuery.ThenByDescending(p => p.CreatedAt)
                : orderedQuery.ThenBy(p => p.CreatedAt),
        };

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await orderedQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetModerationPagedAsync(
        ModerationPostQueryParams query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Posts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status)
            && Enum.TryParse<PostStatus>(query.Status, true, out var statusFilter))
        {
            dbQuery = dbQuery.Where(p => p.Status == statusFilter);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            dbQuery = dbQuery.Where(p => p.Title.Contains(term) || p.Content.Contains(term));
        }

        var sortOldest = string.Equals(query.Sort, "oldest", StringComparison.OrdinalIgnoreCase);
        var orderedQuery = sortOldest
            ? dbQuery.OrderBy(p => p.CreatedAt)
            : dbQuery.OrderByDescending(p => p.CreatedAt);

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await orderedQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<int> CountByStatusAsync(PostStatus status, CancellationToken cancellationToken = default) =>
        _context.Posts.CountAsync(p => p.Status == status, cancellationToken);

    public Task<int> CountByAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default) =>
        _context.Posts.CountAsync(p => p.AuthorId == authorId && p.Status == PostStatus.Published, cancellationToken);

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedByAuthorIdAsync(
        Guid authorId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Posts.Where(p => p.AuthorId == authorId && p.Status == PostStatus.Published);
        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<Post>> GetFeaturedAsync(int limit, CancellationToken cancellationToken = default) =>
        await _context.Posts
            .Where(p => p.IsFeatured && p.Status == PostStatus.Published)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

    public Task<int> CountFeaturedAsync(CancellationToken cancellationToken = default) =>
        _context.Posts.CountAsync(
            p => p.IsFeatured && p.Status == PostStatus.Published,
            cancellationToken);

    public async Task<IReadOnlyList<Post>> GetPinnedAsync(int limit, CancellationToken cancellationToken = default) =>
        await _context.Posts
            .Where(p => p.IsPinned && p.Status == PostStatus.Published)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

    public Task<int> CountPinnedAsync(CancellationToken cancellationToken = default) =>
        _context.Posts.CountAsync(
            p => p.IsPinned && p.Status == PostStatus.Published,
            cancellationToken);

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPublishedCandidatesForPinningAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Posts.Where(p => p.Status == PostStatus.Published && !p.IsPinned);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            dbQuery = dbQuery.Where(p =>
                p.Title.Contains(term) ||
                p.Content.Contains(term) ||
                _context.Users.Any(u => u.Id == p.AuthorId && (u.UserName!.Contains(term) || u.DisplayName.Contains(term))));
        }

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPublishedCandidatesForFeaturingAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Posts.Where(p => p.Status == PostStatus.Published && !p.IsFeatured);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            dbQuery = dbQuery.Where(p =>
                p.Title.Contains(term) ||
                p.Content.Contains(term) ||
                _context.Users.Any(u => u.Id == p.AuthorId && (u.UserName!.Contains(term) || u.DisplayName.Contains(term))));
        }

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task AddAsync(Post post, CancellationToken cancellationToken = default) =>
        await _context.Posts.AddAsync(post, cancellationToken);

    public Task UpdateAsync(Post post, CancellationToken cancellationToken = default)
    {
        _context.Posts.Update(post);
        return Task.CompletedTask;
    }

    public Task SoftDeleteAsync(Post post, Guid deletedById, CancellationToken cancellationToken = default)
    {
        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        post.DeletedById = deletedById;
        _context.Posts.Update(post);
        return Task.CompletedTask;
    }
}
