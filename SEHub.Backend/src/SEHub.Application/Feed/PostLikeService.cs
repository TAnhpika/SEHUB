using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Feed;

public sealed class PostLikeService : IPostLikeService
{
    private readonly IPostLikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IGamificationService _gamificationService;
    private readonly IUnitOfWork _unitOfWork;

    public PostLikeService(
        IPostLikeRepository likeRepository,
        IPostRepository postRepository,
        ICurrentUserService currentUser,
        IGamificationService gamificationService,
        IUnitOfWork unitOfWork)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _currentUser = currentUser;
        _gamificationService = gamificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task<LikeResultDto> LikeAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var existing = await _likeRepository.GetAsync(postId, userId, cancellationToken);
        if (existing is not null)
        {
            return new LikeResultDto
            {
                IsLiked = true,
                LikeCount = await _likeRepository.CountByPostIdAsync(postId, cancellationToken)
            };
        }

        await _likeRepository.AddAsync(new PostLike
        {
            PostId = postId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _gamificationService.AwardLikeReceivedAsync(post.AuthorId, cancellationToken);

        return new LikeResultDto
        {
            IsLiked = true,
            LikeCount = await _likeRepository.CountByPostIdAsync(postId, cancellationToken)
        };
    }

    public async Task<LikeResultDto> UnlikeAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var existing = await _likeRepository.GetAsync(postId, userId, cancellationToken);
        if (existing is not null)
        {
            await _likeRepository.RemoveAsync(existing, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new LikeResultDto
        {
            IsLiked = false,
            LikeCount = await _likeRepository.CountByPostIdAsync(postId, cancellationToken)
        };
    }
}
