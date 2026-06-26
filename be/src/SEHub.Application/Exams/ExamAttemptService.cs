using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public sealed class ExamAttemptService : IExamAttemptService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamAttemptRepository _attemptRepository;
    private readonly IExamGradingService _gradingService;
    private readonly IGamificationEventPublisher _gamificationPublisher;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ExamAttemptService(
        IExamRepository examRepository,
        IExamAttemptRepository attemptRepository,
        IExamGradingService gradingService,
        IGamificationEventPublisher gamificationPublisher,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _examRepository = examRepository;
        _attemptRepository = attemptRepository;
        _gradingService = gradingService;
        _gamificationPublisher = gamificationPublisher;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<ExamAttemptDto> StartAttemptAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var userId = RequirePremiumUser();
        var exam = await _examRepository.GetByIdAsync(examId, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        if (exam.ExamType != ExamType.Final)
        {
            throw new ForbiddenException("Attempts are only available for final exams.");
        }

        var active = await _attemptRepository.GetActiveAsync(userId, examId, cancellationToken);
        if (active is not null)
        {
            throw new ConflictException(ErrorCodes.ActiveAttemptExists);
        }

        var attempt = new ExamAttempt
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ExamId = examId,
            StartedAt = DateTime.UtcNow,
            Status = ExamAttemptStatus.InProgress,
            AnswersJson = "{}",
            CreatedAt = DateTime.UtcNow
        };

        await _attemptRepository.AddAsync(attempt, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapAttempt(attempt);
    }

    public async Task<ExamAttemptDto?> GetCurrentAttemptAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var userId = RequirePremiumUser();
        var attempt = await _attemptRepository.GetActiveAsync(userId, examId, cancellationToken);
        return attempt is null ? null : MapAttempt(attempt);
    }

    public async Task<ExamAttemptDto> GetAttemptAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await GetOwnedAttemptAsync(examId, attemptId, cancellationToken);
        return MapAttempt(attempt);
    }

    public async Task<ExamAttemptDto> SaveAnswersAsync(Guid examId, Guid attemptId, SaveAnswersRequest request, CancellationToken cancellationToken = default)
    {
        var attempt = await GetOwnedAttemptAsync(examId, attemptId, cancellationToken);
        EnsureInProgress(attempt);

        attempt.AnswersJson = ExamAttemptAnswersJson.Serialize(request.Answers);
        attempt.UpdatedAt = DateTime.UtcNow;
        await _attemptRepository.UpdateAsync(attempt, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapAttempt(attempt);
    }

    public async Task<ExamResultDto> SubmitAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await GetOwnedAttemptAsync(examId, attemptId, cancellationToken);
        EnsureInProgress(attempt);

        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        var answers = DeserializeAnswers(attempt.AnswersJson);
        var result = _gradingService.Grade(exam, answers);

        attempt.Status = ExamAttemptStatus.Submitted;
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.Score = result.Score;
        attempt.UpdatedAt = DateTime.UtcNow;

        await _attemptRepository.UpdateAsync(attempt, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _gamificationPublisher.PublishAsync(
            new ExamCompletedEvent(attempt.Id, attempt.UserId, (int?)result.Score),
            cancellationToken);

        return result;
    }

    public async Task<ExamResultDto> GetResultAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await GetOwnedAttemptAsync(examId, attemptId, cancellationToken);
        if (attempt.Status != ExamAttemptStatus.Submitted)
        {
            throw new ForbiddenException("Attempt has not been submitted yet.");
        }

        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        return _gradingService.Grade(exam, DeserializeAnswers(attempt.AnswersJson));
    }

    private async Task<ExamAttempt> GetOwnedAttemptAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken)
    {
        var userId = RequirePremiumUser();
        var attempt = await _attemptRepository.GetByIdAsync(attemptId, cancellationToken)
            ?? throw new NotFoundException("ExamAttempt", attemptId);

        if (attempt.ExamId != examId || attempt.UserId != userId)
        {
            throw new NotFoundException("ExamAttempt", attemptId);
        }

        return attempt;
    }

    private Guid RequirePremiumUser()
    {
        if (_currentUser.UserId is not Guid userId)
        {
            throw new ForbiddenException("Authentication required.");
        }

        if (!_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException(ErrorCodes.PremiumRequired);
        }

        return userId;
    }

    private static void EnsureInProgress(ExamAttempt attempt)
    {
        if (attempt.Status != ExamAttemptStatus.InProgress)
        {
            throw new ConflictException("Attempt is no longer in progress.");
        }
    }

    private static ExamAttemptDto MapAttempt(ExamAttempt attempt) => new()
    {
        Id = attempt.Id,
        ExamId = attempt.ExamId,
        Status = attempt.Status.ToString(),
        StartedAt = attempt.StartedAt,
        Answers = attempt.Status == ExamAttemptStatus.InProgress
            ? DeserializeAnswers(attempt.AnswersJson)
                .ToDictionary(pair => pair.Key, pair => (IReadOnlyList<Guid>)pair.Value)
            : null
    };

    private static Dictionary<Guid, List<Guid>> DeserializeAnswers(string json) =>
        ExamAttemptAnswersJson.Deserialize(json);
}
