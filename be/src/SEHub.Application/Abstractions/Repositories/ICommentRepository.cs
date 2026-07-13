using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface ICommentRepository
{
    Task<Comment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Comment>> GetByPostIdAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Comment>> GetRepliesByParentIdAsync(Guid parentCommentId, CancellationToken cancellationToken = default);
    Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, int>> CountByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default);
    Task<int> CountByAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task AddAsync(Comment comment, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Comment comment, Guid deletedById, CancellationToken cancellationToken = default);
}
