namespace SEHub.Contracts.Admin;

public sealed class EscalateUserReportRequest
{
    public string Source { get; init; } = string.Empty;
}

public sealed class EscalateUserReportResultDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public Guid ReportId { get; init; }
}
