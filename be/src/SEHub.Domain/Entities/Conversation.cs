using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class Conversation : BaseEntity
{
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessagePreview { get; set; }

    public ICollection<ConversationParticipant> Participants { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}
