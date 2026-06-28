using SEHub.Contracts.Messaging;

namespace SEHub.Application.Abstractions;

public interface IChatNotifier
{
    Task NotifyMessageReceivedAsync(
        MessageDto message,
        IReadOnlyList<Guid> participantUserIds,
        CancellationToken cancellationToken = default);

    Task NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken = default);

    Task NotifyPresenceUpdatedAsync(
        UserPresenceDto presence,
        CancellationToken cancellationToken = default);
}
