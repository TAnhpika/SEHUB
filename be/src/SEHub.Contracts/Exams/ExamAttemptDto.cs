namespace SEHub.Contracts.Exams;

public sealed class ExamAttemptDto
{
    public Guid Id { get; init; }
    public Guid ExamId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime StartedAt { get; init; }
    public IReadOnlyDictionary<Guid, IReadOnlyList<Guid>>? Answers { get; init; }
}
