using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Gamification;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/gamification")]
public sealed class GamificationController : ControllerBase
{
    private readonly IGamificationCatalogService _catalogService;

    public GamificationController(IGamificationCatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet("badges")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetBadges(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetBadgesAsync(cancellationToken);
        return Ok(result);
    }
}
