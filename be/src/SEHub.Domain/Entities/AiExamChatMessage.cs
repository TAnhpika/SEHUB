using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class AiExamChatMessage : BaseEntity
{
    public Guid ThreadId { get; set; }
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;

    public AiExamChatThread Thread { get; set; } = null!;
}
