namespace SEHub.Contracts.Messaging;

public sealed class ConversationReportDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public Guid ConversationId { get; init; }
    public string ReporterUsername { get; init; } = string.Empty;
    public string ReporterDisplayName { get; init; } = string.Empty;
    public Guid? ReportedUserId { get; init; }
    public string? ReportedUsername { get; init; }
    public string? ReportedDisplayName { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? ResolutionNote { get; init; }
}
