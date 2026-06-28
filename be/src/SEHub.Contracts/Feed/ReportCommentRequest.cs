namespace SEHub.Contracts.Feed;

public sealed class ReportCommentRequest
{
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
}
