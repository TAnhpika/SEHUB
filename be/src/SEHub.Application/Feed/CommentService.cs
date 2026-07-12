using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
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
    private readonly IGamificationEventPublisher _gamificationPublisher;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        IUserFollowRepository followRepository,
        IGamificationEventPublisher gamificationPublisher,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _followRepository = followRepository;
        _gamificationPublisher = gamificationPublisher;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var roots = await _commentRepository.GetByPostIdAsync(postId, page, pageSize, cancellationToken);
        var total = await _commentRepository.CountByPostIdAsync(postId, cancellationToken);
        var flat = FlattenRootsWithReplies(roots);
        var dtos = await MapCommentsTreeAsync(flat, cancellationToken);

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

            if (parentComment.PostId != postId)
            {
                throw new NotFoundException("Comment", parentId);
            }

            if (parentComment.ParentCommentId is not null)
            {
                throw new DomainException("Chỉ được trả lời bình luận gốc (một cấp).");
            }

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

        await _gamificationPublisher.PublishAsync(new CommentCreatedEvent(comment.Id, userId), cancellationToken);
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

        return await MapSingleCommentAsync(comment, cancellationToken);
    }

    public async Task<CommentDto> UpdateAsync(
        Guid postId,
        Guid commentId,
        UpdateCommentRequest request,
        CancellationToken cancellationToken = default)
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
            throw new ForbiddenException("You do not have permission to edit this comment.");
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapSingleCommentAsync(comment, cancellationToken);
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

        if (comment.ParentCommentId is null)
        {
            var replies = await _commentRepository.GetRepliesByParentIdAsync(comment.Id, cancellationToken);
            foreach (var reply in replies)
            {
                await _commentRepository.SoftDeleteAsync(reply, userId, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _gamificationPublisher.PublishAsync(
            new CommentDeletedEvent(commentId, comment.AuthorId),
            cancellationToken);
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

    private static IReadOnlyList<Comment> FlattenRootsWithReplies(IReadOnlyList<Comment> roots)
    {
        if (roots.Count == 0)
        {
            return [];
        }

        var flat = new List<Comment>(roots.Count * 2);
        var seen = new HashSet<Guid>();

        foreach (var root in roots)
        {
            if (seen.Add(root.Id))
            {
                flat.Add(root);
            }

            if (root.Replies is null || root.Replies.Count == 0)
            {
                continue;
            }

            foreach (var reply in root.Replies.OrderBy(r => r.CreatedAt))
            {
                if (seen.Add(reply.Id))
                {
                    flat.Add(reply);
                }
            }
        }

        return flat;
    }

    private async Task<CommentDto> MapSingleCommentAsync(Comment comment, CancellationToken cancellationToken)
    {
        var author = await BuildAuthorAsync(comment.AuthorId, cancellationToken);
        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            Author = author,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt,
            Replies = null,
        };
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
