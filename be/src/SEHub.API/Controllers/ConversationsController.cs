using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

    [HttpPost("{conversationId:guid}/messages/attachment")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> SendAttachmentMessage(
        Guid conversationId,
        IFormFile file,
        [FromForm] string? content,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _messagingService.SendAttachmentMessageAsync(
            conversationId,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            content,
            cancellationToken);
        return Ok(result);
    }

    [HttpPost("{conversationId:guid}/read")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> MarkRead(Guid conversationId, CancellationToken cancellationToken)
    {
        await _messagingService.MarkReadAsync(conversationId, cancellationToken);
        return Ok(new { read = true });
    }

    [HttpDelete("{conversationId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ClearHistory(Guid conversationId, CancellationToken cancellationToken)
    {
        await _messagingService.ClearConversationHistoryAsync(conversationId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{conversationId:guid}/messages/{messageId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> DeleteMessage(
        Guid conversationId,
        Guid messageId,
        CancellationToken cancellationToken)
    {
        await _messagingService.DeleteMessageAsync(conversationId, messageId, cancellationToken);
        return NoContent();
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
