using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserReportRepository
{
    Task<UserReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserReport?> GetPendingDuplicateAsync(
        Guid reportedUserId,
        Guid reporterId,
        UserReportSource source,
        Guid? postId,
        Guid? questionCommentId,
        CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default);
    Task<int> CountPendingAsync(CancellationToken cancellationToken = default);
    Task AddAsync(UserReport report, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserReport report, CancellationToken cancellationToken = default);
}
