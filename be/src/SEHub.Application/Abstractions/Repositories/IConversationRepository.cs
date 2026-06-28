using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IConversationRepository
{
    Task<Conversation?> GetByIdAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task<Guid?> GetDirectConversationIdAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default);
    Task<Conversation> CreateDirectConversationAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Conversation>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ConversationParticipant?> GetParticipantAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default);
    Task UpdateParticipantLastReadAsync(
        Guid conversationId,
        Guid userId,
        DateTime readAt,
        CancellationToken cancellationToken = default);
    Task ClearParticipantHistoryAsync(
        Guid conversationId,
        Guid userId,
        DateTime clearedAt,
        CancellationToken cancellationToken = default);
    Task UpdateConversationPreviewAsync(
        Guid conversationId,
        string preview,
        DateTime sentAt,
        CancellationToken cancellationToken = default);
    Task<int> GetTotalUnreadCountAsync(
        Guid userId,
        IReadOnlyCollection<Guid>? excludeOtherUserIds = null,
        CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsParticipantAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
}
