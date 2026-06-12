using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Messaging;
using SEHub.Contracts.Messaging;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/conversations")]
public sealed class ConversationsController : ControllerBase
{
    private readonly IMessagingService _messagingService;
    private readonly IConversationReportService _conversationReportService;

    public ConversationsController(
        IMessagingService messagingService,
        IConversationReportService conversationReportService)
    {
        _messagingService = messagingService;
        _conversationReportService = conversationReportService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
    {
        var result = await _messagingService.GetConversationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var result = await _messagingService.GetUnreadCountAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("with/{userId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetOrCreateWithUser(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _messagingService.GetOrCreateDirectConversationAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{conversationId:guid}/messages")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetMessages(
        Guid conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _messagingService.GetMessagesAsync(conversationId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{conversationId:guid}/messages")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _messagingService.SendMessageAsync(conversationId, request.Content, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{conversationId:guid}/read")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> MarkRead(Guid conversationId, CancellationToken cancellationToken)
    {
        await _messagingService.MarkReadAsync(conversationId, cancellationToken);
        return Ok(new { read = true });
    }

    [HttpPost("{conversationId:guid}/report")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ReportConversation(
        Guid conversationId,
        [FromBody] ReportConversationRequest request,
        CancellationToken cancellationToken)
    {
        await _conversationReportService.ReportAsync(
            conversationId,
            request.Reason,
            request.Detail,
            cancellationToken);
        return Ok(new { reported = true });
    }
}
