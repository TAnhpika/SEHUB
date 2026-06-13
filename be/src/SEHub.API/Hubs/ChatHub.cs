using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SEHub.Application.Messaging;
using SEHub.Shared.Constants;
using System.Security.Claims;

namespace SEHub.API.Hubs;

[Authorize(Policy = PolicyNames.RequireAuthenticated)]
public sealed class ChatHub : Hub
{
    private readonly IMessagingService _messagingService;

    public ChatHub(IMessagingService messagingService) => _messagingService = messagingService;

    public override async Task OnConnectedAsync()
    {
        var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.UserIdentifier;

        if (Guid.TryParse(userIdValue, out var userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroupName(userId));
        }

        await base.OnConnectedAsync();
    }

    public Task JoinConversation(Guid conversationId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, GetConversationGroupName(conversationId));

    public async Task SendMessage(Guid conversationId, string content)
    {
        await _messagingService.SendMessageAsync(conversationId, content, Context.ConnectionAborted);
    }

    public static string GetUserGroupName(Guid userId) => $"user:{userId}";

    private static string GetConversationGroupName(Guid conversationId) => $"conversation:{conversationId}";
}
