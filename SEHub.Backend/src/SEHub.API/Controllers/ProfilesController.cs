using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Profiles;
using SEHub.Contracts.Profiles;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/profiles")]
public sealed class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly IProfileStatsService _profileStatsService;

    public ProfilesController(IProfileService profileService, IProfileStatsService profileStatsService)
    {
        _profileService = profileService;
        _profileStatsService = profileStatsService;
    }

    [HttpGet("{username}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetByUsername(string username, CancellationToken cancellationToken)
    {
        var result = await _profileService.GetByUsernameAsync(username, cancellationToken);
        return Ok(result);
    }

    [HttpPut("me")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await _profileService.UpdateMyProfileAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/stats")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetMyStats(CancellationToken cancellationToken)
    {
        var result = await _profileStatsService.GetMyStatsAsync(cancellationToken);
        return Ok(result);
    }
}
