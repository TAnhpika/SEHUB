using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPracticeSubmissionRepository
{
    Task<PracticeSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PracticeSubmission?> GetLatestByUserAndExamAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PracticeSubmission> Items, int TotalCount)> GetPagedByExamAsync(Guid examId, int page, int pageSize, PracticeSubmissionStatus? status, CancellationToken cancellationToken = default);
    Task AddAsync(PracticeSubmission submission, CancellationToken cancellationToken = default);
    Task UpdateAsync(PracticeSubmission submission, CancellationToken cancellationToken = default);
    Task MarkPreviousAsNotLatestAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default);
}
