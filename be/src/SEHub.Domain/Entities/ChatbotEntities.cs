using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class ChatbotSettings : BaseEntity
{
    public string SystemPrompt { get; set; } = string.Empty;
    public string WelcomeMessage { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
}

public class ChatbotKnowledgeEntry : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Tags { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class ChatbotConversation : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public ICollection<ChatbotMessage> Messages { get; set; } = [];
}

public class ChatbotMessage : BaseEntity
{
    public Guid ConversationId { get; set; }
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
    public ChatbotConversation Conversation { get; set; } = null!;
}
