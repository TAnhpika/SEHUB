namespace SEHub.Contracts.Messaging;

public sealed class ReportConversationRequest
{
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
}
