namespace SEHub.Application.Feed;

public interface IPostLikeService
{
    Task<LikeResultDto> LikeAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<LikeResultDto> UnlikeAsync(Guid postId, CancellationToken cancellationToken = default);
}

public sealed class LikeResultDto
{
    public bool IsLiked { get; init; }
    public int LikeCount { get; init; }
}
