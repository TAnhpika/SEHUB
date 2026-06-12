using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IConversationReportRepository
{
    Task<ConversationReport?> GetPendingByConversationAndReporterAsync(
        Guid conversationId,
        Guid reporterId,
        CancellationToken cancellationToken = default);

    Task AddAsync(ConversationReport report, CancellationToken cancellationToken = default);
}
