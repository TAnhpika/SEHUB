using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Users;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserSearchService _userSearchService;
    private readonly IFollowService _followService;

    public UsersController(IUserSearchService userSearchService, IFollowService followService)
    {
        _userSearchService = userSearchService;
        _followService = followService;
    }

    [HttpGet("search")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _userSearchService.SearchAsync(q, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{userId:guid}/follow")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Follow(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _followService.FollowAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{userId:guid}/follow")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Unfollow(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _followService.UnfollowAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/follow-status")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetFollowStatus(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _followService.GetFollowStatusAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/followers")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetFollowers(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _followService.GetFollowersAsync(userId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/following")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetFollowing(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _followService.GetFollowingAsync(userId, page, pageSize, cancellationToken);
        return Ok(result);
    }
}
