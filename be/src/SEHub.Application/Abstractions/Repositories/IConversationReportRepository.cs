using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IConversationReportRepository
{
    Task<ConversationReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ConversationReport?> GetPendingByConversationAndReporterAsync(
        Guid conversationId,
        Guid reporterId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<ConversationReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default);

    Task<int> CountPendingAsync(CancellationToken cancellationToken = default);

    Task AddAsync(ConversationReport report, CancellationToken cancellationToken = default);

    Task UpdateAsync(ConversationReport report, CancellationToken cancellationToken = default);
}
