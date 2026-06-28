using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface ICommentReportRepository
{
    Task<CommentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CommentReport?> GetPendingByCommentAndReporterAsync(
        Guid commentId,
        Guid reporterId,
        CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CommentReport>> GetRecentAsync(
        int take,
        ReportStatus? status,
        CancellationToken cancellationToken = default);
    Task<int> CountAsync(ReportStatus? status, CancellationToken cancellationToken = default);
    Task AddAsync(CommentReport report, CancellationToken cancellationToken = default);
    Task UpdateAsync(CommentReport report, CancellationToken cancellationToken = default);
}
