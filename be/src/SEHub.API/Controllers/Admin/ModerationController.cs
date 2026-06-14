using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Application.Feed;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/moderation")]
[Authorize(Policy = PolicyNames.RequireModerator)]
public sealed class ModerationController : ControllerBase
{
    private readonly IModerationService _moderationService;
    private readonly IPostService _postService;
    private readonly IAdminExportService _exportService;

    public ModerationController(
        IModerationService moderationService,
        IPostService postService,
        IAdminExportService exportService)
    {
        _moderationService = moderationService;
        _postService = postService;
        _exportService = exportService;
    }

    [HttpGet("featured-posts")]
    public async Task<IActionResult> GetFeaturedPosts(
        [FromQuery] string? search,
        [FromQuery] int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var result = await _postService.GetFeaturedModeratorStateAsync(search, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("violations/export.csv")]
    public async Task<IActionResult> ExportViolationsCsv(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportViolationsCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
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
    public async Task<IActionResult> ResolveReport(
        Guid id,
        [FromBody] ResolveReportRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _moderationService.ResolveReportAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] ModerationPostQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetPostsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("posts/{id:guid}")]
    public async Task<IActionResult> GetPost(Guid id, CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetPostAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("posts/{id:guid}")]
    public async Task<IActionResult> ModeratePost(
        Guid id,
        [FromBody] ModeratePostRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _moderationService.ModeratePostAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("banned")]
    public async Task<IActionResult> GetBannedUsers(CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetBannedUsersAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("violations")]
    public async Task<IActionResult> GetViolatingUsers([FromQuery] ViolationsQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetViolatingUsersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("violations/{id:guid}")]
    public async Task<IActionResult> GetViolatingUser(Guid id, CancellationToken cancellationToken)
    {
        var result = await _moderationService.GetViolatingUserAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<IActionResult> BanUser(
        Guid id,
        [FromBody] ModeratorBanUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _moderationService.BanUserAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("users/{id:guid}/warn")]
    public async Task<IActionResult> WarnUser(
        Guid id,
        [FromBody] ModeratorWarnUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _moderationService.WarnUserAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(
        Guid id,
        [FromBody] UnbanUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _moderationService.UnbanUserAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("practice-submissions")]
    public async Task<IActionResult> GetPracticeSubmissions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _moderationService.GetPracticeSubmissionsAsync(page, pageSize, status, cancellationToken);
        return Ok(result);
    }
}
