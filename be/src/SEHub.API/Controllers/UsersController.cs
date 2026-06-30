using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Users;
using SEHub.Contracts.Users;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserSearchService _userSearchService;
    private readonly IFollowService _followService;
    private readonly IUserBlockService _blockService;
    private readonly IUserReportService _userReportService;
    private readonly IAccountPenaltyService _accountPenaltyService;

    public UsersController(
        IUserSearchService userSearchService,
        IFollowService followService,
        IUserBlockService blockService,
        IUserReportService userReportService,
        IAccountPenaltyService accountPenaltyService)
    {
        _userSearchService = userSearchService;
        _followService = followService;
        _blockService = blockService;
        _userReportService = userReportService;
        _accountPenaltyService = accountPenaltyService;
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

    [HttpGet("me/mention-friends")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetMentionFriends(
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _followService.GetMentionFriendsAsync(search, limit, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/penalties/{penaltyId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetMyPenalty(Guid penaltyId, CancellationToken cancellationToken)
    {
        var result = await _accountPenaltyService.GetForCurrentUserAsync(penaltyId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/penalties/latest")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetMyLatestPenalty(
        [FromQuery] string? type,
        CancellationToken cancellationToken = default)
    {
        var result = await _accountPenaltyService.GetLatestForCurrentUserAsync(type, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me/blocked")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ListMyBlockedUsers(CancellationToken cancellationToken)
    {
        var result = await _blockService.ListBlockedByMeAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("{userId:guid}/block")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Block(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _blockService.BlockAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{userId:guid}/block")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Unblock(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _blockService.UnblockAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/block-status")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetBlockStatus(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _blockService.GetBlockStatusAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{userId:guid}/report")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ReportUser(
        Guid userId,
        [FromBody] ReportUserRequest request,
        CancellationToken cancellationToken)
    {
        await _userReportService.ReportAsync(userId, request, cancellationToken);
        return Ok(new { message = "Report submitted" });
    }
}
