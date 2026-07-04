using SEHub.Contracts.Exams;
using SEHub.Contracts.Subjects;
using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(Guid id, bool includeQuestions = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Exam>> GetByIdsAsync(IReadOnlyList<Guid> ids, CancellationToken cancellationToken = default);
    Task<Exam?> GetByTitleAsync(string paperCode, CancellationToken cancellationToken = default);
    Task<Exam?> GetByContentHashAsync(string contentHash, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Exam> Items, int TotalCount)> GetPagedAsync(ExamQueryParams query, CancellationToken cancellationToken = default);
    Task AddAsync(Exam exam, CancellationToken cancellationToken = default);
    Task UpdateAsync(Exam exam, CancellationToken cancellationToken = default);
    Task ReplaceQuestionsAsync(Guid examId, IReadOnlyList<Question> newQuestions, CancellationToken cancellationToken = default);
    Task<int> CountPublishedAsync(CancellationToken cancellationToken = default);
    Task<Exam?> GetPendingRevisionOfAsync(Guid publishedExamId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SubjectSourceEntryDto>> GetDistinctPublishedSubjectsAsync(CancellationToken cancellationToken = default);
    Task UnpinPracticeExamsByCodeAsync(string code, Guid? exceptExamId, CancellationToken cancellationToken = default);
}
