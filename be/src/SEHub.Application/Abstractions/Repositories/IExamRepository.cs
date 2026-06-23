using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(Guid id, bool includeQuestions = false, CancellationToken cancellationToken = default);
    Task<Exam?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Exam?> GetByContentHashAsync(string contentHash, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Exam> Items, int TotalCount)> GetPagedAsync(ExamQueryParams query, CancellationToken cancellationToken = default);
    Task AddAsync(Exam exam, CancellationToken cancellationToken = default);
    Task UpdateAsync(Exam exam, CancellationToken cancellationToken = default);
    Task ReplaceQuestionsAsync(Guid examId, IReadOnlyList<Question> newQuestions, CancellationToken cancellationToken = default);
    Task<int> CountPublishedAsync(CancellationToken cancellationToken = default);
    Task<Exam?> GetPendingRevisionOfAsync(Guid publishedExamId, CancellationToken cancellationToken = default);
}
