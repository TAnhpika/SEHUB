using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Chatbot;
using SEHub.Contracts.Chatbot;

namespace SEHub.API.Controllers;
[ApiController]
[Route("api/v1/chatbot")]
[Authorize]
public sealed class ChatbotController : ControllerBase
{
    private readonly IChatbotApplicationService _chatbotService;

    public ChatbotController(IChatbotApplicationService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var result = await _chatbotService.GetPublicSettingsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
    {
        var result = await _chatbotService.GetMyConversationsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("conversations/{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(Guid conversationId, CancellationToken cancellationToken)
    {
        var result = await _chatbotService.GetConversationMessagesAsync(conversationId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage(
        [FromBody] ChatbotMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _chatbotService.SendMessageAsync(request, cancellationToken);
        return Ok(result);
    }
}
