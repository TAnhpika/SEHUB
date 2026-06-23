namespace SEHub.Application.Messaging;

public interface IConversationReportService
{
    Task ReportAsync(
        Guid conversationId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);
}
