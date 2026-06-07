using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Exams;
using SEHub.Contracts.Exams;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/exams/{examId:guid}/practice-submissions")]
public sealed class PracticeSubmissionsController : ControllerBase
{
    private readonly IPracticeSubmissionService _practiceSubmissionService;

    public PracticeSubmissionsController(IPracticeSubmissionService practiceSubmissionService)
    {
        _practiceSubmissionService = practiceSubmissionService;
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> Submit(Guid examId, [FromBody] SubmitPracticeRequest request, CancellationToken cancellationToken)
    {
        var result = await _practiceSubmissionService.SubmitAsync(examId, request, cancellationToken);
        return CreatedAtAction(nameof(GetMySubmission), new { examId }, result);
    }

    [HttpGet("me")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetMySubmission(Guid examId, CancellationToken cancellationToken)
    {
        var result = await _practiceSubmissionService.GetMySubmissionAsync(examId, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> GetSubmissions(
        Guid examId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _practiceSubmissionService.GetSubmissionsAsync(examId, page, pageSize, status, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{submissionId:guid}")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> Review(Guid examId, Guid submissionId, [FromBody] ReviewPracticeRequest request, CancellationToken cancellationToken)
    {
        var result = await _practiceSubmissionService.ReviewAsync(examId, submissionId, request, cancellationToken);
        return Ok(result);
    }
}
