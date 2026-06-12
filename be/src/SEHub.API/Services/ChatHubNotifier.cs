using Microsoft.AspNetCore.SignalR;
using SEHub.API.Hubs;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Messaging;

namespace SEHub.API.Services;

public sealed class ChatHubNotifier : IChatNotifier
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
}
