using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Chatbot;
using SEHub.Contracts.Chatbot;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/chatbot")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class ChatbotController : ControllerBase
{
    private readonly IAdminChatbotService _adminChatbotService;

    public ChatbotController(IAdminChatbotService adminChatbotService)
    {
        _adminChatbotService = adminChatbotService;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.GetSettingsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdateChatbotSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.UpdateSettingsAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("knowledge")]
    public async Task<IActionResult> GetKnowledge(CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.GetKnowledgeAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("knowledge")]
    public async Task<IActionResult> CreateKnowledge(
        [FromBody] UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.CreateKnowledgeAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPut("knowledge/{id:guid}")]
    public async Task<IActionResult> UpdateKnowledge(
        Guid id,
        [FromBody] UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.UpdateKnowledgeAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("knowledge/{id:guid}")]
    public async Task<IActionResult> DeleteKnowledge(Guid id, CancellationToken cancellationToken)
    {
        await _adminChatbotService.DeleteKnowledgeAsync(id, cancellationToken);
        return Ok(new { message = "Knowledge entry deleted" });
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.GetRecentConversationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> GetConversationMessages(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var result = await _adminChatbotService.GetConversationMessagesAsync(conversationId, cancellationToken);
        return Ok(result);
    }
}
