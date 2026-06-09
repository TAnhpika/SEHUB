namespace SEHub.Contracts.Exams;

public sealed class QuestionOptionDto
{
    public Guid Id { get; init; }
    public string Label { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
}
