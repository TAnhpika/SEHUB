namespace SEHub.Contracts.Admin;

public sealed class CreateExamRequest
{
    public string SubjectCode { get; init; } = string.Empty;
    public string PaperCode { get; init; } = string.Empty;
    public string ExamType { get; init; } = string.Empty;
    public string? Description { get; init; }
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
    /// <summary>Existing CDN image URLs to re-link when questions are rebuild (replace-all).</summary>
    public IReadOnlyList<string> ImageUrls { get; init; } = [];
}

public sealed class CreateExamOptionItem
{
    public Guid Id { get; init; }
    public string Label { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
}
