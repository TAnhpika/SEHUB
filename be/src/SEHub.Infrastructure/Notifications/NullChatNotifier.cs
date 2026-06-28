using SEHub.Application.Abstractions;
using SEHub.Contracts.Messaging;

namespace SEHub.Infrastructure.Notifications;

public sealed class NullChatNotifier : IChatNotifier
{
    public Task NotifyMessageReceivedAsync(
        MessageDto message,
        IReadOnlyList<Guid> participantUserIds,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotifyPresenceUpdatedAsync(
        UserPresenceDto presence,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
