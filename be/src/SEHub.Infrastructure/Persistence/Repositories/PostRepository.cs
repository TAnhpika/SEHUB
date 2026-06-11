using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
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

        var sortDescending = !string.Equals(query.SortDir, "asc", StringComparison.OrdinalIgnoreCase);
        var orderedQuery = (query.SortBy?.Trim().ToLowerInvariant()) switch
        {
            "title" => sortDescending
                ? dbQuery.OrderByDescending(p => p.Title)
                : dbQuery.OrderBy(p => p.Title),
            _ => sortDescending
                ? dbQuery.OrderByDescending(p => p.CreatedAt)
                : dbQuery.OrderBy(p => p.CreatedAt),
        };

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await orderedQuery
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<Post>> GetFeaturedAsync(int limit, CancellationToken cancellationToken = default) =>
        await _context.Posts
            .Where(p => p.IsFeatured && p.Status == PostStatus.Published)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

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
