using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPostReportRepository
{
    Task<PostReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PostReport?> GetPendingByPostAndReporterAsync(Guid postId, Guid reporterId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, ReportStatus? status, CancellationToken cancellationToken = default);
    Task AddAsync(PostReport report, CancellationToken cancellationToken = default);
    Task UpdateAsync(PostReport report, CancellationToken cancellationToken = default);
    Task<int> CountByReporterIdAsync(Guid reporterId, CancellationToken cancellationToken = default);
    Task<int> CountAgainstAuthorIdAsync(Guid authorId, CancellationToken cancellationToken = default);
}
