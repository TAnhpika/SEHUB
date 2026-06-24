using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public MessageType MessageType { get; set; } = MessageType.Text;
    public string? AttachmentPath { get; set; }
    public string? AttachmentPublicId { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentMimeType { get; set; }
    public long? AttachmentSizeBytes { get; set; }
    public DateTime SentAt { get; set; }

    public Conversation Conversation { get; set; } = null!;
}
