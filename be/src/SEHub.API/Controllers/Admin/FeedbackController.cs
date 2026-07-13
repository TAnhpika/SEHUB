using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Feedback;
using SEHub.Contracts.Feedback;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/feedback")]
[Authorize(Policy = PolicyNames.RequireModerator)]
public sealed class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService) => _feedbackService = feedbackService;

    [HttpGet]
    public async Task<IActionResult> GetFeedback(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        FeedbackStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<FeedbackStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var result = await _feedbackService.GetPagedAsync(page, pageSize, statusFilter, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateFeedbackStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _feedbackService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(result);
    }
}
