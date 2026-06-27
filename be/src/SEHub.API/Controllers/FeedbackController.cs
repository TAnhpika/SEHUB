using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Feedback;
using SEHub.Contracts.Feedback;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/feedback")]
public sealed class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService) => _feedbackService = feedbackService;

    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Submit([FromBody] SubmitFeedbackRequest request, CancellationToken cancellationToken)
    {
        var result = await _feedbackService.SubmitAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("attachments")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    [RequestSizeLimit(104_857_600)]
    public async Task<IActionResult> UploadAttachments(IFormFileCollection files, CancellationToken cancellationToken)
    {
        if (files is null || files.Count == 0)
        {
            return BadRequest(new { message = "At least one file is required." });
        }

        var uploads = new List<FeedbackUploadFile>(files.Count);
        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                continue;
            }

            await using var stream = file.OpenReadStream();
            var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer, cancellationToken);
            buffer.Position = 0;

            uploads.Add(new FeedbackUploadFile(
                buffer,
                file.FileName,
                file.ContentType ?? string.Empty,
                file.Length));
        }

        if (uploads.Count == 0)
        {
            return BadRequest(new { message = "At least one file is required." });
        }

        var result = await _feedbackService.UploadAttachmentsAsync(uploads, cancellationToken);
        return Ok(result);
    }
}
