using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Messaging;

public sealed class ConversationReportService : IConversationReportService
{
    private const int MinDetailLength = 10;
    private const int MaxReasonLength = 200;
    private const int MaxDetailLength = 2000;

    private readonly IConversationReportRepository _reportRepository;
    private readonly IConversationRepository _conversationRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ConversationReportService(
        IConversationReportRepository reportRepository,
        IConversationRepository conversationRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _reportRepository = reportRepository;
        _conversationRepository = conversationRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
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

        await _reportRepository.AddAsync(new ConversationReport
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            ReporterId = reporterId,
            Reason = trimmedReason,
            Detail = trimmedDetail,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
