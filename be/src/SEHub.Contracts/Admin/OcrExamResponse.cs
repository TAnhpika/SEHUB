namespace SEHub.Contracts.Admin;

public sealed class OcrExamResponse
{
    public string Text { get; init; } = string.Empty;
    public string ContentHash { get; init; } = string.Empty;
    public bool DuplicateWarning { get; init; }
    public Guid? DuplicateExamId { get; init; }
    public IReadOnlyList<CreateExamQuestionItem> Questions { get; init; } = [];
}
