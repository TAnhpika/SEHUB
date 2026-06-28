using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed;

public interface ICommentReportService
{
    Task ReportAsync(
        Guid postId,
        Guid commentId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);
}
