namespace SEHub.Contracts.Exams;

public sealed class ExamAttemptHistoryItemDto
{
    public Guid AttemptId { get; init; }
    public Guid ExamId { get; init; }
    public string ExamPaperCode { get; init; } = string.Empty;
    public string SubjectCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime StartedAt { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public decimal? ScorePercent { get; init; }
    public int TotalQuestions { get; init; }
    public int? CorrectCount { get; init; }
}
