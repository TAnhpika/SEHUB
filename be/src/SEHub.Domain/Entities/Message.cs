using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }

    public Conversation Conversation { get; set; } = null!;
}
