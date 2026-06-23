using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface INotificationRepository
{
    Task<UserNotification?> GetByIdForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<UserNotification> Items, int TotalCount)> GetPagedForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task AddAsync(UserNotification notification, CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(Guid userId, DateTime readAt, CancellationToken cancellationToken = default);
}
