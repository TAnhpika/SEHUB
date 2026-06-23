using SEHub.Application.Abstractions;
using SEHub.Contracts.Notifications;

namespace SEHub.Infrastructure.Notifications;

public sealed class NullNotificationNotifier : INotificationNotifier
{
    public Task NotifyCreatedAsync(
        Guid userId,
        NotificationDto notification,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
