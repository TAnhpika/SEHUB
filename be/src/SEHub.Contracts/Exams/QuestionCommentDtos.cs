namespace SEHub.Contracts.Exams;

public sealed class QuestionCommentDto
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
    public QuestionCommentAuthorDto Author { get; init; } = null!;
    public Guid? ParentCommentId { get; init; }
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<QuestionCommentDto>? Replies { get; init; }
}

public sealed class QuestionCommentAuthorDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
}

public sealed class CreateQuestionCommentRequest
{
    public string Content { get; init; } = string.Empty;
    public Guid? ParentCommentId { get; init; }
}
