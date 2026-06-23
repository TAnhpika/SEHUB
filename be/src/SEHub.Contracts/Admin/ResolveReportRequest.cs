namespace SEHub.Contracts.Admin;

public sealed class ResolveReportRequest
{
    public string Status { get; init; } = string.Empty;
    public string? Action { get; init; }
}
