namespace SEHub.Contracts.Admin;

public sealed class UpdateExamRequest
{
    public string? SubjectCode { get; init; }
    public string? PaperCode { get; init; }
    public string? ExamType { get; init; }
    public string? Description { get; init; }
    public string? Status { get; init; }
    public IReadOnlyList<CreateExamQuestionItem>? Questions { get; init; }
}
