namespace SEHub.Contracts.Feed;

public sealed class CreateCommentRequest
{
    public string Content { get; init; } = string.Empty;
    public Guid? ParentCommentId { get; init; }
}
