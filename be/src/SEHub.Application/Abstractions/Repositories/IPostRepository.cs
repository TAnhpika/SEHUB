using SEHub.Contracts.Admin;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPostRepository
{
    Task<Post?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedAsync(PostQueryParams query, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Post> Items, int TotalCount)> GetModerationPagedAsync(ModerationPostQueryParams query, CancellationToken cancellationToken = default);
    Task<int> CountByStatusAsync(PostStatus status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Post>> GetFeaturedAsync(int limit, CancellationToken cancellationToken = default);
    Task AddAsync(Post post, CancellationToken cancellationToken = default);
    Task UpdateAsync(Post post, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Post post, Guid deletedById, CancellationToken cancellationToken = default);
}
