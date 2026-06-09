namespace SEHub.Contracts.Exams;

public sealed class QuestionAnswerDto
{
    public Guid Id { get; init; }
    public int OrderIndex { get; init; }
    public string Content { get; init; } = string.Empty;
    public IReadOnlyList<QuestionOptionDto> Options { get; init; } = [];
    public Guid? CorrectOptionId { get; init; }
}
