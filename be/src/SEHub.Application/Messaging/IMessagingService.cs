using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;

namespace SEHub.Application.Messaging;

public interface IMessagingService
{
    Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(CancellationToken cancellationToken = default);
    Task<ConversationListItemDto> GetOrCreateDirectConversationAsync(
        Guid otherUserId,
        CancellationToken cancellationToken = default);
    Task<PagedResult<MessageDto>> GetMessagesAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<MessageDto> SendMessageAsync(
        Guid conversationId,
        string content,
        CancellationToken cancellationToken = default);
    Task MarkReadAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task<UnreadCountDto> GetUnreadCountAsync(CancellationToken cancellationToken = default);
}
