namespace SEHub.Contracts.Users;

public sealed class ReportUserRequest
{
    public string Source { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public Guid? PostId { get; init; }
    public Guid? ExamId { get; init; }
    public Guid? QuestionId { get; init; }
    public Guid? QuestionCommentId { get; init; }
}
