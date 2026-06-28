using Microsoft.AspNetCore.SignalR;
using SEHub.API.Hubs;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Messaging;
using SEHub.Contracts.Notifications;

namespace SEHub.API.Services;

public sealed class ChatHubNotifier : IChatNotifier, INotificationNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatHubNotifier(IHubContext<ChatHub> hubContext) => _hubContext = hubContext;

    public Task NotifyMessageReceivedAsync(
        MessageDto message,
        IReadOnlyList<Guid> participantUserIds,
        CancellationToken cancellationToken = default)
    {
        var conversationGroup = $"conversation:{message.ConversationId}";
        return _hubContext.Clients.Group(conversationGroup).SendAsync("ReceiveMessage", message, cancellationToken);
    }

    public Task NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken = default)
    {
        var userGroup = ChatHub.GetUserGroupName(userId);
        return _hubContext.Clients.Group(userGroup).SendAsync(
            "UnreadCountUpdated",
            new UnreadCountDto { TotalUnread = totalUnread },
            cancellationToken);
    }

    public Task NotifyPresenceUpdatedAsync(
        UserPresenceDto presence,
        CancellationToken cancellationToken = default) =>
        _hubContext.Clients.All.SendAsync("UserPresenceUpdated", presence, cancellationToken);

    public Task NotifyCreatedAsync(
        Guid userId,
        NotificationDto notification,
        CancellationToken cancellationToken = default)
    {
        var userGroup = ChatHub.GetUserGroupName(userId);
        return _hubContext.Clients.Group(userGroup).SendAsync("NotificationReceived", notification, cancellationToken);
    }

    Task INotificationNotifier.NotifyUnreadCountUpdatedAsync(
        Guid userId,
        int totalUnread,
        CancellationToken cancellationToken) =>
        _hubContext.Clients.Group(ChatHub.GetUserGroupName(userId)).SendAsync(
            "NotificationUnreadUpdated",
            new UnreadNotificationCountDto { TotalUnread = totalUnread },
            cancellationToken);
}
