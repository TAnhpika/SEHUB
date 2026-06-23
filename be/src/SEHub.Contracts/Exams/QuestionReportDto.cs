namespace SEHub.Contracts.Exams;

public sealed class QuestionReportDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public Guid ExamId { get; init; }
    public string ExamCode { get; init; } = string.Empty;
    public Guid QuestionId { get; init; }
    public int QuestionIndex { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string? MarkedAnswer { get; init; }
    public string ReporterUsername { get; init; } = string.Empty;
    public string ReporterDisplayName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string? ResolutionNote { get; init; }
}
