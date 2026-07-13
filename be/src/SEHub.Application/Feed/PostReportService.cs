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

public sealed class PostReportService : IPostReportService
{
    private readonly IPostReportRepository _reportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public PostReportService(
        IPostReportRepository reportRepository,
        IPostRepository postRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _postRepository = postRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task ReportAsync(Guid postId, string reason, CancellationToken cancellationToken = default)
    {
        var reporterId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        _ = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        var existing = await _reportRepository.GetPendingByPostAndReporterAsync(postId, reporterId, cancellationToken);
        if (existing is not null)
        {
            throw new ConflictException("You have already reported this post.");
        }

        var plainReason = HtmlContentHelper.ToPlainText(reason);
        if (string.IsNullOrWhiteSpace(plainReason))
        {
            throw new DomainException("Report reason is required.");
        }

        var reportId = Guid.NewGuid();
        await _reportRepository.AddAsync(new PostReport
        {
            Id = reportId,
            PostId = postId,
            ReporterId = reporterId,
            Reason = plainReason,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);
        await _workflowNotifications.NotifyModeratorsPostReportedAsync(
            reportId,
            postId,
            reporterId,
            plainReason,
            cancellationToken);
    }
}
