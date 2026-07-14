namespace SEHub.Contracts.Chatbot;

public sealed class ChatbotMessageRequest
{
    public string Message { get; init; } = string.Empty;
    public Guid? ConversationId { get; init; }
}

public sealed class ChatbotMessageDto
{
    public Guid Id { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class ChatbotConversationDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public sealed class RenameChatbotConversationRequest
{
    public string Title { get; init; } = string.Empty;
}

public sealed class ChatbotReplyResponse
{
    public Guid ConversationId { get; init; }
    public string Reply { get; init; } = string.Empty;
    public int TokensUsed { get; init; }
    public int RemainingTokens { get; init; }
    public IReadOnlyList<ChatbotMessageDto> Messages { get; init; } = Array.Empty<ChatbotMessageDto>();
}

public sealed class ChatbotSettingsDto
{
    public string SystemPrompt { get; init; } = string.Empty;
    public string WelcomeMessage { get; init; } = string.Empty;
    public bool IsEnabled { get; init; }
}

public sealed class UpdateChatbotSettingsRequest
{
    public string SystemPrompt { get; init; } = string.Empty;
    public string WelcomeMessage { get; init; } = string.Empty;
    public bool IsEnabled { get; init; } = true;
}

public sealed class ChatbotKnowledgeEntryDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string? Tags { get; init; }
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
}

public sealed class UpsertChatbotKnowledgeRequest
{
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string? Tags { get; init; }
    public bool IsActive { get; init; } = true;
    public int SortOrder { get; init; }
}

public sealed class AdminChatbotConversationDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public int MessageCount { get; init; }
}
