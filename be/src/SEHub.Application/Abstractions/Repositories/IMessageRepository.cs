using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IMessageRepository
{
    Task AddAsync(Message message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Message>> GetPagedAsync(
        Guid conversationId,
        int page,
        int pageSize,
        DateTime? visibleAfter = null,
        CancellationToken cancellationToken = default);
    Task<int> CountAsync(
        Guid conversationId,
        DateTime? visibleAfter = null,
        CancellationToken cancellationToken = default);
    Task<Message?> GetLatestAsync(Guid conversationId, CancellationToken cancellationToken = default);
    Task<Message?> GetByIdAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Message message, CancellationToken cancellationToken = default);

    Task<int> CountSentByUserSinceAsync(
        Guid senderId,
        DateTime sinceUtc,
        CancellationToken cancellationToken = default);
}
