using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Messaging;

public sealed class ConversationReportService : IConversationReportService
{
    private const int MinDetailLength = 10;
    private const int MaxReasonLength = 200;
    private const int MaxDetailLength = 2000;

    private readonly IConversationReportRepository _reportRepository;
    private readonly IConversationRepository _conversationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public ConversationReportService(
        IConversationReportRepository reportRepository,
        IConversationRepository conversationRepository,
        IUserRepository userRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _conversationRepository = conversationRepository;
        _userRepository = userRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task ReportAsync(
        Guid conversationId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default)
    {
        var reporterId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (!await _conversationRepository.IsParticipantAsync(conversationId, reporterId, cancellationToken))
        {
            throw new ForbiddenException("You are not a participant in this conversation.");
        }

        var trimmedReason = reason.Trim();
        var trimmedDetail = detail.Trim();

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

        var existing = await _reportRepository.GetPendingByConversationAndReporterAsync(
            conversationId,
            reporterId,
            cancellationToken);

        if (existing is not null)
        {
            throw new ConflictException("You have already reported this conversation.");
        }

        var reportId = Guid.NewGuid();
        await _reportRepository.AddAsync(new ConversationReport
        {
            Id = reportId,
            ConversationId = conversationId,
            ReporterId = reporterId,
            Reason = trimmedReason,
            Detail = trimmedDetail,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);

        await _workflowNotifications.NotifyModeratorsConversationReportedAsync(
            reportId,
            conversationId,
            reporterId,
            trimmedReason,
            trimmedDetail,
            cancellationToken);
    }

    public async Task<PagedResult<ConversationReportDto>> GetReportsAsync(
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
        var dtos = new List<ConversationReportDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapAsync(item, cancellationToken));
        }

        return new PagedResult<ConversationReportDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<ConversationReportDto> ResolveAsync(
        Guid id,
        ResolveConversationReportRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var report = await _reportRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("ConversationReport", id);

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

    private async Task<ConversationReportDto> MapAsync(
        ConversationReport report,
        CancellationToken cancellationToken)
    {
        var reporter = await _userRepository.GetByIdAsync(report.ReporterId, cancellationToken);
        var reportedUserId = report.Conversation?.Participants
            .FirstOrDefault(p => p.UserId != report.ReporterId)
            ?.UserId;

        var reportedUser = reportedUserId is Guid userId
            ? await _userRepository.GetByIdAsync(userId, cancellationToken)
            : null;

        return new ConversationReportDto
        {
            Id = report.Id,
            Code = $"URP-{report.Id.ToString()[..4].ToUpperInvariant()}",
            Status = report.Status.ToString(),
            Reason = report.Reason,
            Detail = report.Detail,
            ConversationId = report.ConversationId,
            ReporterUsername = reporter?.Username ?? "unknown",
            ReporterDisplayName = reporter?.DisplayName ?? "Unknown",
            ReportedUserId = reportedUserId,
            ReportedUsername = reportedUser?.Username,
            ReportedDisplayName = reportedUser?.DisplayName,
            CreatedAt = report.CreatedAt,
            ResolutionNote = report.ResolutionNote,
        };
    }
}
