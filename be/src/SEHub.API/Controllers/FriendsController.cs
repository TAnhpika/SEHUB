using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Friends;
using SEHub.Contracts.Friends;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/friends")]
public sealed class FriendsController : ControllerBase
{
    private readonly IFriendService _friendService;

    public FriendsController(IFriendService friendService) => _friendService = friendService;

    [HttpPost("request")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> SendRequest(
        [FromBody] SendFriendRequestRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _friendService.SendRequestAsync(request.TargetUserId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("accept")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Accept(
        [FromBody] FriendRequestActionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _friendService.AcceptRequestAsync(request.RequestId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("reject")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Reject(
        [FromBody] FriendRequestActionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _friendService.RejectRequestAsync(request.RequestId, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("cancel")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Cancel(
        [FromQuery] Guid requestId,
        CancellationToken cancellationToken)
    {
        await _friendService.CancelRequestAsync(requestId, cancellationToken);
        return Ok(new { cancelled = true });
    }

    [HttpDelete("unfriend")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Unfriend(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken)
    {
        await _friendService.UnfriendAsync(userId, cancellationToken);
        return Ok(new { unfriended = true });
    }

    [HttpGet("requests")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetRequests(
        [FromQuery] string direction = "incoming",
        CancellationToken cancellationToken = default)
    {
        var result = await _friendService.GetRequestsAsync(direction, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetFriends(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _friendService.GetFriendsAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("status/{userId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetStatus(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _friendService.GetFriendStatusAsync(userId, cancellationToken);
        return Ok(result);
    }
}
