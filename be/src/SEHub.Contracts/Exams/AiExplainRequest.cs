namespace SEHub.Contracts.Exams;

public sealed class AiExplainRequest
{
    public Guid QuestionId { get; init; }
    public string? Context { get; init; }
}
