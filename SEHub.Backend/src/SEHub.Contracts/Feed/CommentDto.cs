namespace SEHub.Contracts.Feed;

public sealed class CommentDto
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
    public AuthorSummaryDto Author { get; init; } = null!;
    public Guid? ParentCommentId { get; init; }
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<CommentDto>? Replies { get; init; }
}
