namespace SEHub.Contracts.Admin;

public sealed class ResubmitExamRequest
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? AssetUrl { get; init; }
    public IReadOnlyList<CreateExamQuestionItem> Questions { get; init; } = [];
}
