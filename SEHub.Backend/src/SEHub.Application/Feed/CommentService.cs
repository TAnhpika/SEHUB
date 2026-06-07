using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Feed;

public sealed class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var comments = await _commentRepository.GetByPostIdAsync(postId, page, pageSize, cancellationToken);
        var total = await _commentRepository.CountByPostIdAsync(postId, cancellationToken);
        var topLevel = comments.Where(c => c.ParentCommentId is null).ToList();
        var dtos = new List<CommentDto>();

        foreach (var comment in topLevel)
        {
            dtos.Add(await MapCommentAsync(comment, comments, cancellationToken));
        }

        return new PagedResult<CommentDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<CommentDto> CreateAsync(Guid postId, CreateCommentRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        if (request.ParentCommentId is Guid parentId)
        {
            _ = await _commentRepository.GetByIdAsync(parentId, cancellationToken)
                ?? throw new NotFoundException("Comment", parentId);
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        await _commentRepository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapCommentAsync(comment, [comment], cancellationToken);
    }

    public async Task DeleteAsync(Guid postId, Guid commentId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment", commentId);

        if (comment.PostId != postId)
        {
            throw new NotFoundException("Comment", commentId);
        }

        if (!_currentUser.IsModeratorOrAdmin && comment.AuthorId != userId)
        {
            throw new ForbiddenException("You do not have permission to delete this comment.");
        }

        await _commentRepository.SoftDeleteAsync(comment, userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<CommentDto> MapCommentAsync(Comment comment, IReadOnlyList<Comment> all, CancellationToken cancellationToken)
    {
        var author = await BuildAuthorAsync(comment.AuthorId, cancellationToken);
        var replies = all
            .Where(c => c.ParentCommentId == comment.Id)
            .Select(async c => await MapCommentAsync(c, all, cancellationToken));

        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            Author = author,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt,
            Replies = await Task.WhenAll(replies)
        };
    }

    private async Task<AuthorSummaryDto> BuildAuthorAsync(Guid authorId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(authorId, cancellationToken);
        var profile = await _profileRepository.GetByUserIdAsync(authorId, cancellationToken);

        return new AuthorSummaryDto
        {
            Id = authorId,
            Username = user?.Username ?? "unknown",
            DisplayName = user?.DisplayName ?? "Unknown",
            AvatarUrl = profile?.AvatarUrl
        };
    }
}
