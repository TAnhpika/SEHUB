using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Feed;

public sealed class CommentReportService : ICommentReportService
{
    private const int MinDetailLength = 10;
    private const int MaxReasonLength = 200;
    private const int MaxDetailLength = 2000;

    private readonly ICommentReportRepository _reportRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public CommentReportService(
        ICommentReportRepository reportRepository,
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task ReportAsync(
        Guid postId,
        Guid commentId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default)
    {
        var reporterId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment", commentId);

        if (comment.PostId != postId)
        {
            throw new ForbiddenException("Comment does not belong to this post.");
        }

        if (comment.AuthorId == reporterId)
        {
            throw new ForbiddenException("You cannot report your own comment.");
        }

        var trimmedReason = HtmlContentHelper.ToPlainText(reason);
        var trimmedDetail = HtmlContentHelper.ToPlainText(detail);

        if (string.IsNullOrWhiteSpace(trimmedReason))
        {
            throw new DomainException("Report reason is required.");
        }

        if (trimmedReason.Length > MaxReasonLength)
        {
            throw new DomainException($"Report reason cannot exceed {MaxReasonLength} characters.");
        }

        if (trimmedDetail.Length < MinDetailLength)
        {
            throw new DomainException($"Report detail must be at least {MinDetailLength} characters.");
        }

        if (trimmedDetail.Length > MaxDetailLength)
        {
            throw new DomainException($"Report detail cannot exceed {MaxDetailLength} characters.");
        }

        var existing = await _reportRepository.GetPendingByCommentAndReporterAsync(
            commentId,
            reporterId,
            cancellationToken);

        if (existing is not null)
        {
            throw new ConflictException("You have already reported this comment.");
        }

        var reportId = Guid.NewGuid();
        await _reportRepository.AddAsync(new CommentReport
        {
            Id = reportId,
            PostId = postId,
            CommentId = commentId,
            ReporterId = reporterId,
            Reason = trimmedReason,
            Detail = trimmedDetail,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);
        await _workflowNotifications.NotifyModeratorsCommentReportedAsync(
            reportId,
            postId,
            commentId,
            reporterId,
            trimmedReason,
            cancellationToken);
    }
}
