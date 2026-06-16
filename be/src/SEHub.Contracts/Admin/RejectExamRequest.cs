namespace SEHub.Contracts.Admin;

public sealed class RejectExamRequest
{
    public string ReasonCode { get; init; } = string.Empty;
    public string ReasonLabel { get; init; } = string.Empty;
    public string? Detail { get; init; }
}
