using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Application.Notifications;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public sealed class QuestionReportService : IQuestionReportService
{
    private readonly IQuestionReportRepository _reportRepository;
    private readonly IExamRepository _examRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public QuestionReportService(
        IQuestionReportRepository reportRepository,
        IExamRepository examRepository,
        IUserRepository userRepository,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _examRepository = examRepository;
        _userRepository = userRepository;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task<QuestionReportDto> ReportAsync(
        Guid examId,
        Guid questionId,
        CreateQuestionReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var reporterId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        var question = exam.Questions.FirstOrDefault(q => q.Id == questionId)
            ?? throw new NotFoundException("Question", questionId);

        var existing = await _reportRepository.GetPendingByQuestionAndReporterAsync(
            questionId,
            reporterId,
            cancellationToken);
        if (existing is not null)
        {
            throw new ConflictException("You have already reported this question.");
        }

        var reason = HtmlContentHelper.ToPlainText(request.Reason);
        var detail = HtmlContentHelper.ToPlainText(request.Detail);
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new DomainException("Vui lòng chọn lý do báo cáo.");
        }

        if (detail.Length < 10)
        {
            throw new DomainException("Mô tả chi tiết phải có ít nhất 10 ký tự.");
        }

        var reportId = Guid.NewGuid();
        var report = new QuestionReport
        {
            Id = reportId,
            QuestionId = questionId,
            ExamId = examId,
            ReporterId = reporterId,
            Reason = reason,
            Detail = detail,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        await _reportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _cache.Remove(ModerationCacheKeys.Stats);

        await _workflowNotifications.NotifyModeratorsQuestionReportedAsync(
            reportId,
            question,
            exam,
            reporterId,
            reason,
            detail,
            cancellationToken);

        report.Question = question;
        report.Exam = exam;
        return await MapAsync(report, cancellationToken);
    }

    public async Task<PagedResult<QuestionReportDto>> GetReportsAsync(
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
        var dtos = new List<QuestionReportDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapAsync(item, cancellationToken));
        }

        return new PagedResult<QuestionReportDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<QuestionReportDto> ResolveAsync(
        Guid id,
        ResolveQuestionReportRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var report = await _reportRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("QuestionReport", id);

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

    private async Task<QuestionReportDto> MapAsync(QuestionReport report, CancellationToken cancellationToken)
    {
        var reporter = await _userRepository.GetByIdAsync(report.ReporterId, cancellationToken);
        var question = report.Question;
        var exam = report.Exam;

        return new QuestionReportDto
        {
            Id = report.Id,
            Code = $"EQR-{report.Id.ToString()[..8].ToUpperInvariant()}",
            Status = report.Status.ToString(),
            Reason = report.Reason,
            Detail = report.Detail,
            ExamId = report.ExamId,
            ExamCode = exam?.SubjectCode ?? string.Empty,
            QuestionId = report.QuestionId,
            QuestionIndex = question?.OrderIndex ?? 0,
            QuestionText = question?.Content ?? string.Empty,
            MarkedAnswer = BuildMarkedAnswer(question),
            ReporterUsername = reporter?.Username ?? "unknown",
            ReporterDisplayName = reporter?.DisplayName ?? "Unknown",
            CreatedAt = report.CreatedAt,
            ResolutionNote = report.ResolutionNote,
        };
    }

    private static string? BuildMarkedAnswer(Question? question)
    {
        if (question is null)
        {
            return null;
        }

        if (question.CorrectOptionId is Guid optionId)
        {
            var option = question.Options.FirstOrDefault(o => o.Id == optionId);
            return option?.Label;
        }

        return null;
    }
}
