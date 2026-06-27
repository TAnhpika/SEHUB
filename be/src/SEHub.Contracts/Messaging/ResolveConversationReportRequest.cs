namespace SEHub.Contracts.Messaging;

public sealed class ResolveConversationReportRequest
{
    public string Status { get; init; } = "Resolved";
    public string? ResolutionNote { get; init; }
}
