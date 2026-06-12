using SEHub.Contracts.Notifications;

namespace SEHub.Application.Abstractions;

public interface INotificationNotifier
{
    Task NotifyCreatedAsync(
        Guid userId,
        NotificationDto notification,
        CancellationToken cancellationToken = default);

    Task NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken = default);
}
