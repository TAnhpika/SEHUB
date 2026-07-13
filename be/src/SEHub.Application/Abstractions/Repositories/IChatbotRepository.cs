namespace SEHub.Application.Abstractions.Repositories;

public interface IChatbotRepository
{
    Task<Domain.Entities.ChatbotSettings> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task UpdateSettingsAsync(Domain.Entities.ChatbotSettings settings, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotKnowledgeEntry>> GetActiveKnowledgeAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotKnowledgeEntry>> GetAllKnowledgeAsync(CancellationToken cancellationToken = default);

    Task<Domain.Entities.ChatbotKnowledgeEntry?> GetKnowledgeByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddKnowledgeAsync(Domain.Entities.ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default);

    Task UpdateKnowledgeAsync(Domain.Entities.ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default);

    Task DeleteKnowledgeAsync(Domain.Entities.ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotKnowledgeEntry>> SearchKnowledgeAsync(
        string query,
        int take,
        CancellationToken cancellationToken = default);

    Task<Domain.Entities.ChatbotConversation?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotConversation>> GetUserConversationsAsync(
        Guid userId,
        int take,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotConversation>> GetRecentConversationsAsync(
        int take,
        CancellationToken cancellationToken = default);

    Task AddConversationAsync(Domain.Entities.ChatbotConversation conversation, CancellationToken cancellationToken = default);

    Task UpdateConversationAsync(Domain.Entities.ChatbotConversation conversation, CancellationToken cancellationToken = default);

    Task DeleteConversationAsync(Domain.Entities.ChatbotConversation conversation, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.ChatbotMessage>> GetMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default);

    Task AddMessageAsync(Domain.Entities.ChatbotMessage message, CancellationToken cancellationToken = default);
}
