namespace SEHub.Contracts.Exams;

public sealed class ResolveQuestionReportRequest
{
    public string Status { get; init; } = "Resolved";
    public string? ResolutionNote { get; init; }
}
