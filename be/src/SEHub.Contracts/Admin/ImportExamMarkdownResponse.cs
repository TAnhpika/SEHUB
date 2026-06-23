namespace SEHub.Contracts.Admin;

public sealed class ImportExamMarkdownResponse
{
    public IReadOnlyList<CreateExamQuestionItem> Questions { get; init; } = [];
    public int QuestionCount { get; init; }
    public IReadOnlyList<string> Warnings { get; init; } = [];
}
