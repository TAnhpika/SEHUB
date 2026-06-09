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
}
