using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IQuestionReportRepository
{
    Task<QuestionReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<QuestionReport?> GetPendingByQuestionAndReporterAsync(
        Guid questionId,
        Guid reporterId,
        CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<QuestionReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default);
    Task<int> CountPendingAsync(CancellationToken cancellationToken = default);
    Task AddAsync(QuestionReport report, CancellationToken cancellationToken = default);
    Task UpdateAsync(QuestionReport report, CancellationToken cancellationToken = default);
}
