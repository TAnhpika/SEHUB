using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPostLikeRepository
{
    Task<PostLike?> GetAsync(Guid postId, Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, int>> CountByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default);
    Task<IReadOnlySet<Guid>> GetLikedPostIdsAsync(
        Guid userId,
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default);
    Task AddAsync(PostLike like, CancellationToken cancellationToken = default);
    Task RemoveAsync(PostLike like, CancellationToken cancellationToken = default);
}
