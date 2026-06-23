using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams;

public interface IQuestionReportService
{
    Task<QuestionReportDto> ReportAsync(
        Guid examId,
        Guid questionId,
        CreateQuestionReportRequest request,
        CancellationToken cancellationToken = default);

    Task<PagedResult<QuestionReportDto>> GetReportsAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default);

    Task<QuestionReportDto> ResolveAsync(
        Guid id,
        ResolveQuestionReportRequest request,
        CancellationToken cancellationToken = default);

    Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);
}
