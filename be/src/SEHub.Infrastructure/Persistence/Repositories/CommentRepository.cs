using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly SEHubDbContext _context;

    public CommentRepository(SEHubDbContext context) => _context = context;

    public Task<Comment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Comments.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Comment>> GetByPostIdAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default) =>
        await _context.Comments
            .Where(c => c.PostId == postId && c.ParentCommentId == null)
            .Include(c => c.Replies)
            .OrderBy(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Comment>> GetRepliesByParentIdAsync(
        Guid parentCommentId,
        CancellationToken cancellationToken = default) =>
        await _context.Comments
            .Where(c => c.ParentCommentId == parentCommentId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default) =>
        _context.Comments.CountAsync(c => c.PostId == postId, cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, int>> CountByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default)
    {
        if (postIds.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _context.Comments
            .Where(c => postIds.Contains(c.PostId))
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count, cancellationToken);
    }

    public Task<int> CountByAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default) =>
        _context.Comments.CountAsync(c => c.AuthorId == authorId && !c.IsDeleted, cancellationToken);

    public async Task AddAsync(Comment comment, CancellationToken cancellationToken = default) =>
        await _context.Comments.AddAsync(comment, cancellationToken);

    public Task SoftDeleteAsync(Comment comment, Guid deletedById, CancellationToken cancellationToken = default)
    {
        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.DeletedById = deletedById;
        _context.Comments.Update(comment);
        return Task.CompletedTask;
    }
}
