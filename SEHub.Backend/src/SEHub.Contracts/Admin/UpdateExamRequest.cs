namespace SEHub.Contracts.Admin;

public sealed class UpdateExamRequest
{
    public string? Code { get; init; }
    public string? Title { get; init; }
    public string? ExamType { get; init; }
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public string? Description { get; init; }
    public string? Status { get; init; }
    public IReadOnlyList<CreateExamQuestionItem>? Questions { get; init; }
}
