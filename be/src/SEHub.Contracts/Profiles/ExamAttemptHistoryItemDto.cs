namespace SEHub.Contracts.Profiles;

public sealed class ExamAttemptHistoryItemDto
{
    public Guid AttemptId { get; init; }
    public Guid ExamId { get; init; }
    public string ExamCode { get; init; } = string.Empty;
    public string ExamTitle { get; init; } = string.Empty;
    public string Major { get; init; } = string.Empty;
    public int Semester { get; init; }
    public int QuestionCount { get; init; }
    public DateTime SubmittedAt { get; init; }
    public decimal ScorePercent { get; init; }
    public int CorrectCount { get; init; }
}
