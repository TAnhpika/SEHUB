namespace SEHub.Contracts.Exams;

public sealed class QuestionAnswerDto
{
    public Guid Id { get; init; }
    public int OrderIndex { get; init; }
    public string Content { get; init; } = string.Empty;
    public string QuestionType { get; init; } = "SingleChoice";
    public int? RequiredSelectCount { get; init; }
    public IReadOnlyList<QuestionOptionDto> Options { get; init; } = [];
    public Guid? CorrectOptionId { get; init; }
    public IReadOnlyList<Guid> CorrectOptionIds { get; init; } = [];
}
