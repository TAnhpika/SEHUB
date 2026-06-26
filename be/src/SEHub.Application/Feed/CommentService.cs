using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
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
    private readonly IUserFollowRepository _followRepository;
    private readonly IBadgeCheckService _badgeCheckService;
    private readonly IUserActivityService _userActivityService;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        IUserFollowRepository followRepository,
        IBadgeCheckService badgeCheckService,
        IUserActivityService userActivityService,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _followRepository = followRepository;
        _badgeCheckService = badgeCheckService;
        _userActivityService = userActivityService;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var comments = await _commentRepository.GetByPostIdAsync(postId, page, pageSize, cancellationToken);
        var total = await _commentRepository.CountByPostIdAsync(postId, cancellationToken);
        var dtos = await MapCommentsTreeAsync(comments, cancellationToken);

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
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        Guid? parentCommentAuthorId = null;
        Comment? parentComment = null;
        if (request.ParentCommentId is Guid parentId)
        {
            parentComment = await _commentRepository.GetByIdAsync(parentId, cancellationToken)
                ?? throw new NotFoundException("Comment", parentId);
            parentCommentAuthorId = parentComment.AuthorId;
        }

        var content = request.Content;
        if (parentComment is not null)
        {
            var parentUser = await _userRepository.GetByIdAsync(parentComment.AuthorId, cancellationToken);
            if (!string.IsNullOrWhiteSpace(parentUser?.Username))
            {
                content = CommentMentionHelper.EnsureReplyMention(content, parentUser.Username);
            }
        }

        var mentionedUserIds = await ResolveAndValidateMentionsAsync(
            userId,
            content,
            parentCommentAuthorId,
            cancellationToken);

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        await _commentRepository.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _badgeCheckService.EvaluateForTriggerAsync(userId, BadgeCheckService.TriggerCommentsCreated, cancellationToken);
        await _userActivityService.RecordActivityAsync(userId, cancellationToken);
        await _workflowNotifications.NotifyPostCommentedAsync(
            post,
            comment,
            userId,
            parentCommentAuthorId,
            cancellationToken);
        await _workflowNotifications.NotifyMentionedInCommentAsync(
            post,
            comment,
            mentionedUserIds,
            userId,
            cancellationToken);

        return (await MapCommentsTreeAsync([comment], cancellationToken))[0];
    }

    private async Task<IReadOnlyList<Guid>> ResolveAndValidateMentionsAsync(
        Guid authorUserId,
        string content,
        Guid? replyTargetUserId,
        CancellationToken cancellationToken)
    {
        var usernames = CommentMentionHelper.ExtractUsernames(content);
        if (usernames.Count == 0)
        {
            return [];
        }

        var mentionedUserIds = new List<Guid>();
        foreach (var username in usernames)
        {
            var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
                ?? throw new DomainException($"Không tìm thấy người dùng @{username}.");

            if (user.Id == authorUserId)
            {
                continue;
            }

            var isReplyTarget = replyTargetUserId == user.Id;
            if (!isReplyTarget)
            {
                var isMutualFriend = await _followRepository.IsMutualFollowAsync(
                    authorUserId,
                    user.Id,
                    cancellationToken);
                if (!isMutualFriend)
                {
                    throw new ForbiddenException(
                        $"Chỉ có thể tag bạn bè (follow qua lại). @{username} chưa đủ điều kiện.");
                }
            }

            mentionedUserIds.Add(user.Id);
        }

        return mentionedUserIds;
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

    private async Task<IReadOnlyList<CommentDto>> MapCommentsTreeAsync(
        IReadOnlyList<Comment> comments,
        CancellationToken cancellationToken)
    {
        if (comments.Count == 0)
        {
            return [];
        }

        var authorIds = comments.Select(c => c.AuthorId).Distinct().ToList();
        var authors = await _userRepository.GetByIdsAsync(authorIds, cancellationToken);
        var profiles = await _profileRepository.GetByUserIdsAsync(authorIds, cancellationToken);

        var authorsById = authors.ToDictionary(a => a.Id);
        var profilesByUserId = profiles.ToDictionary(p => p.UserId);

        var childrenByParentId = new Dictionary<Guid, List<Comment>>();
        var roots = new List<Comment>();

        foreach (var comment in comments)
        {
            if (comment.ParentCommentId is Guid parentId)
            {
                if (!childrenByParentId.TryGetValue(parentId, out var children))
                {
                    children = [];
                    childrenByParentId[parentId] = children;
                }

                children.Add(comment);
            }
            else
            {
                roots.Add(comment);
            }
        }

        CommentDto MapNode(Comment comment)
        {
            IReadOnlyList<CommentDto>? replies = null;
            if (childrenByParentId.TryGetValue(comment.Id, out var children) && children.Count > 0)
            {
                replies = children.Select(MapNode).ToList();
            }

            return new CommentDto
            {
                Id = comment.Id,
                Content = comment.Content,
                Author = BuildAuthorSummary(comment.AuthorId, authorsById, profilesByUserId),
                ParentCommentId = comment.ParentCommentId,
                CreatedAt = comment.CreatedAt,
                Replies = replies
            };
        }

        return roots.Select(MapNode).ToList();
    }

    private static AuthorSummaryDto BuildAuthorSummary(
        Guid authorId,
        IReadOnlyDictionary<Guid, UserAccount> authorsById,
        IReadOnlyDictionary<Guid, UserProfile> profilesByUserId)
    {
        authorsById.TryGetValue(authorId, out var user);
        profilesByUserId.TryGetValue(authorId, out var profile);

        return new AuthorSummaryDto
        {
            Id = authorId,
            Username = user?.Username ?? "unknown",
            DisplayName = user?.DisplayName ?? "Unknown",
            AvatarUrl = profile?.AvatarUrl
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
