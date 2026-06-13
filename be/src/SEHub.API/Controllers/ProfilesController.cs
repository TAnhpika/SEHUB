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
    private readonly IProfileActivityService _profileActivityService;

    public ProfilesController(
        IProfileService profileService,
        IProfileStatsService profileStatsService,
        IProfileActivityService profileActivityService)
    {
        _profileService = profileService;
        _profileStatsService = profileStatsService;
        _profileActivityService = profileActivityService;
    }

    [HttpGet("{username}/activity")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetActivityByUsername(
        string username,
        [FromQuery] int months = 6,
        CancellationToken cancellationToken = default)
    {
        var result = await _profileActivityService.GetByUsernameAsync(username, months, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{username}/stats")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetStatsByUsername(string username, CancellationToken cancellationToken)
    {
        var result = await _profileStatsService.GetByUsernameAsync(username, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{username}/posts")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetPostsByUsername(
        string username,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        CancellationToken cancellationToken = default)
    {
        var result = await _profileService.GetRecentPostsByUsernameAsync(username, page, pageSize, cancellationToken);
        return Ok(result);
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

    [HttpPost("me/avatar")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadMyAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _profileService.UploadMyAvatarAsync(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            cancellationToken);
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
