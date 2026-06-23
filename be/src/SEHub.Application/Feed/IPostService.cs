using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed;

public interface IPostService
{
    Task<PagedResult<PostListItemDto>> GetPostsAsync(PostQueryParams query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeaturedPostDto>> GetFeaturedAsync(CancellationToken cancellationToken = default);
    Task<FeaturedPostsStateDto> GetFeaturedModeratorStateAsync(
        string? search,
        int candidatePageSize = 100,
        CancellationToken cancellationToken = default);
    Task<PostDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PostDetailDto> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken = default);
    Task<PostDetailDto> UpdateAsync(Guid id, UpdatePostRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PostDetailDto> SetFeaturedAsync(Guid id, FeaturePostRequest request, CancellationToken cancellationToken = default);
}
