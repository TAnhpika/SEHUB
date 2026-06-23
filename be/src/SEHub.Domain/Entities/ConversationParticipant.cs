namespace SEHub.Domain.Entities;

public class ConversationParticipant
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }

    public Conversation Conversation { get; set; } = null!;
}
