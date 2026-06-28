using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Users;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Users;

public sealed class UserReportService : IUserReportService
{
    private const int MinDetailLength = 10;
    private const int MaxReasonLength = 200;
    private const int MaxDetailLength = 2000;

    private readonly IUserReportRepository _reportRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly IQuestionCommentRepository _questionCommentRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public UserReportService(
        IUserReportRepository reportRepository,
        IUserRepository userRepository,
        IPostRepository postRepository,
        IQuestionCommentRepository questionCommentRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
        _postRepository = postRepository;
        _questionCommentRepository = questionCommentRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task ReportAsync(
        Guid reportedUserId,
        ReportUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var reporterId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (reportedUserId == reporterId)
        {
            throw new ForbiddenException("You cannot report yourself.");
        }

        _ = await _userRepository.GetByIdAsync(reportedUserId, cancellationToken)
            ?? throw new NotFoundException("User", reportedUserId);

        var trimmedReason = request.Reason.Trim();
        var trimmedDetail = request.Detail.Trim();

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

        var source = ParseSource(request.Source);
        Guid? postId = null;
        Guid? examId = null;
        Guid? questionId = null;
        Guid? questionCommentId = null;

        switch (source)
        {
            case UserReportSource.Post:
                if (request.PostId is not Guid pid)
                {
                    throw new DomainException("PostId is required for post user reports.");
                }

                var post = await _postRepository.GetByIdAsync(pid, cancellationToken)
                    ?? throw new NotFoundException("Post", pid);

                if (post.AuthorId != reportedUserId)
                {
                    throw new ForbiddenException("Reported user is not the author of this post.");
                }

                postId = pid;
                break;

            case UserReportSource.Profile:
                break;

            case UserReportSource.QuestionComment:
                if (request.ExamId is not Guid eid
                    || request.QuestionId is not Guid qid
                    || request.QuestionCommentId is not Guid cid)
                {
                    throw new DomainException("ExamId, QuestionId and QuestionCommentId are required.");
                }

                var comment = await _questionCommentRepository.GetByIdAsync(cid, cancellationToken)
                    ?? throw new NotFoundException("QuestionComment", cid);

                if (comment.ExamId != eid || comment.QuestionId != qid)
                {
                    throw new ForbiddenException("Comment does not belong to this question.");
                }

                if (comment.AuthorId != reportedUserId)
                {
                    throw new ForbiddenException("Reported user is not the author of this comment.");
                }

                examId = eid;
                questionId = qid;
                questionCommentId = cid;
                break;
        }

        var existing = await _reportRepository.GetPendingDuplicateAsync(
            reportedUserId,
            reporterId,
            source,
            postId,
            questionCommentId,
            cancellationToken);

        if (existing is not null)
        {
            throw new ConflictException("You have already reported this user for this context.");
        }

        var reportId = Guid.NewGuid();
        await _reportRepository.AddAsync(new UserReport
        {
            Id = reportId,
            ReportedUserId = reportedUserId,
            ReporterId = reporterId,
            Source = source,
            PostId = postId,
            ExamId = examId,
            QuestionId = questionId,
            QuestionCommentId = questionCommentId,
            Reason = trimmedReason,
            Detail = trimmedDetail,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);

        await _workflowNotifications.NotifyModeratorsUserReportedAsync(
            reportId,
            reportedUserId,
            reporterId,
            trimmedReason,
            trimmedDetail,
            cancellationToken);
    }

    public async Task<PagedResult<UserReportDto>> GetReportsAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        ReportStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReportStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var (items, total) = await _reportRepository.GetPagedAsync(page, pageSize, statusFilter, cancellationToken);
        var dtos = new List<UserReportDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapAsync(item, cancellationToken));
        }

        return new PagedResult<UserReportDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<UserReportDto> ResolveAsync(
        Guid id,
        ResolveUserReportRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var report = await _reportRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("UserReport", id);

        if (!Enum.TryParse<ReportStatus>(request.Status, true, out var status))
        {
            throw new ForbiddenException("Invalid report status.");
        }

        report.Status = status;
        report.ResolvedById = actorId;
        report.ResolutionNote = request.ResolutionNote?.Trim();
        report.UpdatedAt = DateTime.UtcNow;

        await _reportRepository.UpdateAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);

        return await MapAsync(report, cancellationToken);
    }

    public async Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        return await _reportRepository.CountPendingAsync(cancellationToken);
    }

    private static UserReportSource ParseSource(string source)
    {
        var normalized = source.Trim().ToLowerInvariant();
        return normalized switch
        {
            "post" => UserReportSource.Post,
            "question_comment" or "questioncomment" => UserReportSource.QuestionComment,
            "profile" => UserReportSource.Profile,
            _ => throw new DomainException("Invalid user report source."),
        };
    }

    private async Task<UserReportDto> MapAsync(UserReport report, CancellationToken cancellationToken)
    {
        var reporter = await _userRepository.GetByIdAsync(report.ReporterId, cancellationToken);
        var reportedUser = await _userRepository.GetByIdAsync(report.ReportedUserId, cancellationToken);

        return new UserReportDto
        {
            Id = report.Id,
            Code = $"URP-{report.Id.ToString()[..4].ToUpperInvariant()}",
            Status = report.Status.ToString(),
            Reason = report.Reason,
            Detail = report.Detail,
            Source = report.Source.ToString(),
            ReportedUserId = report.ReportedUserId,
            ReportedUsername = reportedUser?.Username ?? "unknown",
            ReportedDisplayName = reportedUser?.DisplayName ?? "Unknown",
            ReporterUsername = reporter?.Username ?? "unknown",
            ReporterDisplayName = reporter?.DisplayName ?? "Unknown",
            PostId = report.PostId,
            ExamId = report.ExamId,
            QuestionId = report.QuestionId,
            QuestionCommentId = report.QuestionCommentId,
            CreatedAt = report.CreatedAt,
            ResolutionNote = report.ResolutionNote,
        };
    }
}
