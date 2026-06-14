using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/gamification")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class GamificationController : ControllerBase
{
    private readonly IAdminGamificationService _gamificationService;

    public GamificationController(IAdminGamificationService gamificationService)
    {
        _gamificationService = gamificationService;
    }

    [HttpGet("levels")]
    public async Task<IActionResult> GetLevels(CancellationToken cancellationToken)
    {
        var result = await _gamificationService.GetLevelsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("levels")]
    public async Task<IActionResult> UpdateLevels([FromBody] UpdateLevelsRequest request, CancellationToken cancellationToken)
    {
        var result = await _gamificationService.UpdateLevelsAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("badges")]
    public async Task<IActionResult> GetBadges(CancellationToken cancellationToken)
    {
        var result = await _gamificationService.GetBadgesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("badges")]
    public async Task<IActionResult> CreateBadge([FromBody] CreateBadgeRequest request, CancellationToken cancellationToken)
    {
        var result = await _gamificationService.CreateBadgeAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPut("badges/{id:guid}")]
    public async Task<IActionResult> UpdateBadge(Guid id, [FromBody] UpdateBadgeRequest request, CancellationToken cancellationToken)
    {
        var result = await _gamificationService.UpdateBadgeAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("badges/{id:guid}")]
    public async Task<IActionResult> DeleteBadge(Guid id, CancellationToken cancellationToken)
    {
        await _gamificationService.DeleteBadgeAsync(id, cancellationToken);
        return Ok(new { message = "Badge deleted" });
    }
}
