using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;

namespace SEHub.Application.Messaging;

public interface IConversationReportService
{
    Task ReportAsync(
        Guid conversationId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);

    Task<PagedResult<ConversationReportDto>> GetReportsAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default);

    Task<ConversationReportDto> ResolveAsync(
        Guid id,
        ResolveConversationReportRequest request,
        CancellationToken cancellationToken = default);

    Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default);
}
