using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPostImageRepository
{
    Task<PostImage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImage>> GetByPostIdAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PostImage>> GetByPostIdsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default);
    Task AddAsync(PostImage image, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<PostImage> images, CancellationToken cancellationToken = default);
    Task DeleteRangeAsync(IEnumerable<PostImage> images, CancellationToken cancellationToken = default);
}
