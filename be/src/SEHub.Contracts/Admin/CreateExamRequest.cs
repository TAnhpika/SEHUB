namespace SEHub.Contracts.Admin;

public sealed class CreateExamRequest
{
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public string? Description { get; init; }
    public string? AssetUrl { get; init; }
    public IReadOnlyList<CreateExamQuestionItem> Questions { get; init; } = [];
    public bool IsPinned { get; init; }
}

public sealed class CreateExamQuestionItem
{
    public int OrderIndex { get; init; }
    public string Content { get; init; } = string.Empty;
    public string QuestionType { get; init; } = "SingleChoice";
    public int? RequiredSelectCount { get; init; }
    public IReadOnlyList<CreateExamOptionItem> Options { get; init; } = [];
    public Guid CorrectOptionId { get; init; }
    public IReadOnlyList<Guid> CorrectOptionIds { get; init; } = [];
}

public sealed class CreateExamOptionItem
{
    public Guid Id { get; init; }
    public string Label { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
}
