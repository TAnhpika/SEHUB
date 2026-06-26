using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PostLikeRepository : IPostLikeRepository
{
    private readonly SEHubDbContext _context;

    public PostLikeRepository(SEHubDbContext context) => _context = context;

    public Task<PostLike?> GetAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default) =>
        _context.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId, cancellationToken);

    public Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default) =>
        _context.PostLikes.CountAsync(l => l.PostId == postId, cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> CountByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default)
    {
        if (postIds.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _context.PostLikes
            .Where(l => postIds.Contains(l.PostId))
            .GroupBy(l => l.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count, cancellationToken);
    }

    public async Task<IReadOnlySet<Guid>> GetLikedPostIdsAsync(
        Guid userId,
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default)
    {
        if (postIds.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var likedIds = await _context.PostLikes
            .Where(l => l.UserId == userId && postIds.Contains(l.PostId))
            .Select(l => l.PostId)
            .ToListAsync(cancellationToken);

        return likedIds.ToHashSet();
    }

    public async Task AddAsync(PostLike like, CancellationToken cancellationToken = default) =>
        await _context.PostLikes.AddAsync(like, cancellationToken);

    public Task RemoveAsync(PostLike like, CancellationToken cancellationToken = default)
    {
        _context.PostLikes.Remove(like);
        return Task.CompletedTask;
    }
}
