using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Feed;

public sealed class PostReportService : IPostReportService
{
    private readonly IPostReportRepository _reportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public PostReportService(
        IPostReportRepository reportRepository,
        IPostRepository postRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _reportRepository = reportRepository;
        _postRepository = postRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
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

        var reportId = Guid.NewGuid();
        await _reportRepository.AddAsync(new PostReport
        {
            Id = reportId,
            PostId = postId,
            ReporterId = reporterId,
            Reason = reason,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _workflowNotifications.NotifyModeratorsPostReportedAsync(
            reportId,
            postId,
            reporterId,
            reason,
            cancellationToken);
    }
}
