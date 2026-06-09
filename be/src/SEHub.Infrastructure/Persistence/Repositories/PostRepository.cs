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
            dbQuery = dbQuery.Where(p => p.Title.Contains(query.Search) || p.Content.Contains(query.Search));
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            dbQuery = dbQuery.Where(p => p.Tags.Contains(query.Tag));
        }

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
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
