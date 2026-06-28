using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SEHub.Application.Abstractions;
using SEHub.Application.Messaging;
using SEHub.Shared.Constants;
using System.Security.Claims;

namespace SEHub.API.Hubs;

[Authorize(Policy = PolicyNames.RequireAuthenticated)]
public sealed class ChatHub : Hub
{
    private readonly IMessagingService _messagingService;
    private readonly IUserPresenceService _presenceService;

    public ChatHub(IMessagingService messagingService, IUserPresenceService presenceService)
    {
        _messagingService = messagingService;
        _presenceService = presenceService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = TryGetUserId();
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroupName(userId.Value));
            await _presenceService.RegisterConnectedAsync(
                userId.Value,
                Context.ConnectionId,
                Context.ConnectionAborted);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = TryGetUserId();
        if (userId.HasValue)
        {
            await _presenceService.RegisterDisconnectedAsync(
                userId.Value,
                Context.ConnectionId,
                Context.ConnectionAborted);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public Task JoinConversation(Guid conversationId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, GetConversationGroupName(conversationId));

    public async Task SendMessage(Guid conversationId, string content)
    {
        await _messagingService.SendMessageAsync(conversationId, content, Context.ConnectionAborted);
    }

    public async Task PingPresence()
    {
        var userId = TryGetUserId();
        if (!userId.HasValue)
        {
            return;
        }

        await _presenceService.PingAsync(userId.Value, Context.ConnectionAborted);
    }

    public static string GetUserGroupName(Guid userId) => $"user:{userId}";

    private static string GetConversationGroupName(Guid conversationId) => $"conversation:{conversationId}";

    private Guid? TryGetUserId()
    {
        var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.UserIdentifier;

        return Guid.TryParse(userIdValue, out var userId) ? userId : null;
    }
}
