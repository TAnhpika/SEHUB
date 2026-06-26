using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PostImageRepository : IPostImageRepository
{
    private readonly SEHubDbContext _context;

    public PostImageRepository(SEHubDbContext context) => _context = context;

    public Task<PostImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PostImages.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public async Task<IReadOnlyList<PostImage>> GetByPostIdAsync(Guid postId, CancellationToken cancellationToken = default) =>
        await _context.PostImages
            .Where(i => i.PostId == postId)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PostImage>> GetByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default)
    {
        if (postIds.Count == 0)
        {
            return [];
        }

        return await _context.PostImages
            .Where(i => postIds.Contains(i.PostId))
            .OrderBy(i => i.PostId)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(PostImage image, CancellationToken cancellationToken = default) =>
        await _context.PostImages.AddAsync(image, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<PostImage> images, CancellationToken cancellationToken = default) =>
        await _context.PostImages.AddRangeAsync(images, cancellationToken);

    public Task DeleteRangeAsync(IEnumerable<PostImage> images, CancellationToken cancellationToken = default)
    {
        _context.PostImages.RemoveRange(images);
        return Task.CompletedTask;
    }
}
