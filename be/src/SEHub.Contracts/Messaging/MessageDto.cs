namespace SEHub.Contracts.Messaging;

public sealed class MessageDto
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string Content { get; init; } = string.Empty;
    public DateTime SentAt { get; init; }
    public bool IsMine { get; init; }
}
