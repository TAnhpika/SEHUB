namespace SEHub.Contracts.Admin;

public sealed class ResubmitExamRequest
{
    public string PaperCode { get; init; } = string.Empty;
    public string? Description { get; init; }
    public IReadOnlyList<CreateExamQuestionItem> Questions { get; init; } = [];
}
