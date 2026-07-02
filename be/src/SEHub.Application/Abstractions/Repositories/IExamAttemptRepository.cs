using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IExamAttemptRepository
{
    Task<ExamAttempt?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ExamAttempt?> GetActiveAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default);
    Task AddAsync(ExamAttempt attempt, CancellationToken cancellationToken = default);
    Task UpdateAsync(ExamAttempt attempt, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExamAttempt>> GetByUserAndExamAsync(Guid userId, Guid examId, ExamAttemptStatus? status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExamAttempt>> GetHistoryByUserAndSubjectCodeAsync(
        Guid userId,
        string subjectCode,
        ExamType? examType,
        int limit,
        CancellationToken cancellationToken = default);
    Task<int> CountSubmittedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> CountSubmittedWithMinScoreAsync(Guid userId, decimal minScore, CancellationToken cancellationToken = default);
}
