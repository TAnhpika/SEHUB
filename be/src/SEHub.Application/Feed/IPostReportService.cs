namespace SEHub.Application.Feed;

public interface IPostReportService
{
    Task ReportAsync(Guid postId, string reason, CancellationToken cancellationToken = default);
}
