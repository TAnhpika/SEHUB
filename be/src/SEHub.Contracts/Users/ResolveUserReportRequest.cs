namespace SEHub.Contracts.Users;

public sealed class ResolveUserReportRequest
{
    public string Status { get; init; } = string.Empty;
    public string? ResolutionNote { get; init; }
}
