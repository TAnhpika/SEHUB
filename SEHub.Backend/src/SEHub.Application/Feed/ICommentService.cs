using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed;

public interface ICommentService
{
    Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<CommentDto> CreateAsync(Guid postId, CreateCommentRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid postId, Guid commentId, CancellationToken cancellationToken = default);
}
