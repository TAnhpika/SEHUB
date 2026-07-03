using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Profiles;

public sealed class ExamAttemptHistoryService : IExamAttemptHistoryService
{
    private readonly IExamAttemptRepository _examAttemptRepository;
    private readonly ICurrentUserService _currentUser;

    public ExamAttemptHistoryService(
        IExamAttemptRepository examAttemptRepository,
        ICurrentUserService currentUser)
    {
        _examAttemptRepository = examAttemptRepository;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<ExamAttemptHistoryItemDto>> GetMyExamAttemptsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var userId = RequirePremiumUser();
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 50);

        var (attempts, totalCount) = await _examAttemptRepository.GetSubmittedFinalPagedByUserIdAsync(
            userId,
            safePage,
            safePageSize,
            cancellationToken);

        return new PagedResult<ExamAttemptHistoryItemDto>
        {
            Items = attempts.Select(MapToDto).ToList(),
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = totalCount
        };
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

    private static ExamAttemptHistoryItemDto MapToDto(ExamAttempt attempt)
    {
        var questionCount = attempt.Exam?.QuestionCount ?? 0;
        var scorePercent = attempt.Score ?? 0m;
        var correctCount = questionCount > 0
            ? (int)Math.Round(scorePercent / 100m * questionCount, MidpointRounding.AwayFromZero)
            : 0;

        return new ExamAttemptHistoryItemDto
        {
            AttemptId = attempt.Id,
            ExamId = attempt.ExamId,
            ExamCode = attempt.Exam?.Code ?? string.Empty,
            ExamTitle = attempt.Exam?.Title ?? string.Empty,
            Major = attempt.Exam?.Major ?? string.Empty,
            Semester = attempt.Exam?.Semester ?? 0,
            QuestionCount = questionCount,
            SubmittedAt = attempt.SubmittedAt ?? attempt.StartedAt,
            ScorePercent = scorePercent,
            CorrectCount = correctCount
        };
    }
}
