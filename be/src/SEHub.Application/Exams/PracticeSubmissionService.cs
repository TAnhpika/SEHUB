using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification;
using SEHub.Application.Profiles;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Exams;

public sealed class PracticeSubmissionService : IPracticeSubmissionService
{
    private readonly IPracticeSubmissionRepository _submissionRepository;
    private readonly IExamRepository _examRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBadgeCheckService _badgeCheckService;
    private readonly IUserActivityService _userActivityService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PracticeSubmissionService(
        IPracticeSubmissionRepository submissionRepository,
        IExamRepository examRepository,
        IUserRepository userRepository,
        IBadgeCheckService badgeCheckService,
        IUserActivityService userActivityService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _submissionRepository = submissionRepository;
        _examRepository = examRepository;
        _userRepository = userRepository;
        _badgeCheckService = badgeCheckService;
        _userActivityService = userActivityService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PracticeSubmissionDto> SubmitAsync(Guid examId, SubmitPracticeRequest request, CancellationToken cancellationToken = default)
    {
        var userId = RequirePremiumUser();
        var exam = await _examRepository.GetByIdAsync(examId, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        if (exam.ExamType != ExamType.Practice)
        {
            throw new ForbiddenException("Submissions are only allowed for practice exams.");
        }

        await _submissionRepository.MarkPreviousAsNotLatestAsync(userId, examId, cancellationToken);

        var submission = new PracticeSubmission
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ExamId = examId,
            GitHubRepoUrl = request.GitHubRepoUrl,
            SubmittedAt = DateTime.UtcNow,
            Status = PracticeSubmissionStatus.Submitted,
            IsLatest = true,
            CreatedAt = DateTime.UtcNow
        };

        await _submissionRepository.AddAsync(submission, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _badgeCheckService.EvaluateForTriggerAsync(
            userId,
            BadgeCheckService.TriggerPracticeSubmissions,
            cancellationToken);
        await _userActivityService.RecordActivityAsync(userId, cancellationToken);

        return _mapper.Map<PracticeSubmissionDto>(submission);
    }

    public async Task<PracticeSubmissionDto?> GetMySubmissionAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var userId = RequirePremiumUser();
        var submission = await _submissionRepository.GetLatestByUserAndExamAsync(userId, examId, cancellationToken);
        return submission is null ? null : _mapper.Map<PracticeSubmissionDto>(submission);
    }

    public async Task<PagedResult<PracticeSubmissionListItemDto>> GetSubmissionsAsync(Guid examId, int page, int pageSize, string? status, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        PracticeSubmissionStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PracticeSubmissionStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var (items, total) = await _submissionRepository.GetPagedByExamAsync(examId, page, pageSize, statusFilter, cancellationToken);
        var dtos = new List<PracticeSubmissionListItemDto>();

        foreach (var item in items)
        {
            var user = await _userRepository.GetByIdAsync(item.UserId, cancellationToken);
            dtos.Add(new PracticeSubmissionListItemDto
            {
                Id = item.Id,
                ExamId = item.ExamId,
                GitHubRepoUrl = item.GitHubRepoUrl,
                Status = item.Status.ToString(),
                SubmittedAt = item.SubmittedAt,
                ReviewerComment = item.ReviewerComment,
                ReviewedAt = item.ReviewedAt,
                User = new PracticeSubmissionUserSummaryDto
                {
                    Id = item.UserId,
                    Username = user?.Username ?? "unknown",
                    DisplayName = user?.DisplayName ?? "Unknown"
                }
            });
        }

        return new PagedResult<PracticeSubmissionListItemDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PracticeSubmissionDto> ReviewAsync(Guid examId, Guid submissionId, ReviewPracticeRequest request, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        var submission = await _submissionRepository.GetByIdAsync(submissionId, cancellationToken)
            ?? throw new NotFoundException("PracticeSubmission", submissionId);

        if (submission.ExamId != examId)
        {
            throw new NotFoundException("PracticeSubmission", submissionId);
        }

        if (!Enum.TryParse<PracticeSubmissionStatus>(request.Status, true, out var status)
            || status is not (
                PracticeSubmissionStatus.Reviewed
                or PracticeSubmissionStatus.Passed
                or PracticeSubmissionStatus.Failed))
        {
            throw new ForbiddenException("Review status must be Reviewed, Passed, or Failed.");
        }

        submission.Status = status;
        submission.ReviewerComment = request.ReviewerComment;
        submission.ReviewedById = _currentUser.UserId;
        submission.ReviewedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;

        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PracticeSubmissionDto>(submission);
    }

    private Guid RequirePremiumUser()
    {
        if (_currentUser.UserId is not Guid userId)
        {
            throw new ForbiddenException("Authentication required.");
        }

        if (!_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Premium subscription required.");
        }

        return userId;
    }
}
