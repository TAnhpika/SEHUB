using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/moderation")]
[Authorize(Policy = PolicyNames.RequireModerator)]
public sealed class ModerationController : ControllerBase
{
    private readonly IModerationService _moderationService;

    public ModerationController(IModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        var result = await _moderationService.GetReportsAsync(page, pageSize, status, cancellationToken);
        return Ok(result);
    }

    [HttpGet("reports/{id:guid}")]
    public async Task<IActionResult> GetReport(Guid id, CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetReportAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("reports/{id:guid}")]
    public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportRequest request, CancellationToken cancellationToken)
    {
        var result = await _moderationService.ResolveReportAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("banned")]
    public async Task<IActionResult> GetBannedUsers(CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetBannedUsersAsync(cancellationToken);
        return Ok(result);
    }
}
