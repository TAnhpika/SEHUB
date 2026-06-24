namespace SEHub.Contracts.Exams;

public sealed class CreateQuestionReportRequest
{
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
}
