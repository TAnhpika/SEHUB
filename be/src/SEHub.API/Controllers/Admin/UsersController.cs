using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using SEHub.Application.Admin;

using SEHub.Contracts.Admin;

using SEHub.Shared.Constants;



namespace SEHub.API.Controllers.Admin;



[ApiController]

[Route("api/v1/admin/users")]

public sealed class UsersController : ControllerBase

{

    private readonly IAdminUserService _adminUserService;



    public UsersController(IAdminUserService adminUserService)

    {

        _adminUserService = adminUserService;

    }



    [HttpGet]

    [Authorize(Policy = PolicyNames.RequireAdmin)]

    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, CancellationToken cancellationToken = default)

    {

        var result = await _adminUserService.GetUsersAsync(page, pageSize, search, cancellationToken);

        return Ok(result);

    }



    [HttpGet("{id:guid}")]

    [Authorize(Policy = PolicyNames.RequireAdmin)]

    public async Task<IActionResult> GetUser(Guid id, CancellationToken cancellationToken)

    {

        var result = await _adminUserService.GetUserAsync(id, cancellationToken);

        return Ok(result);

    }



    [HttpPatch("{id:guid}")]

    [Authorize(Policy = PolicyNames.RequireModerator)]

    public async Task<IActionResult> PatchUser(Guid id, [FromBody] AdminUserPatchRequest request, CancellationToken cancellationToken)

    {

        var result = await _adminUserService.PatchUserAsync(id, request, cancellationToken);

        return Ok(result);

    }



    [HttpPost("{id:guid}/reset-password")]

    [Authorize(Policy = PolicyNames.RequireAdmin)]

    public async Task<IActionResult> ResetPassword(Guid id, CancellationToken cancellationToken)

    {

        await _adminUserService.ResetPasswordAsync(id, cancellationToken);

        return Ok(new { message = "Password reset" });

    }



    [HttpPost("{id:guid}/grant-tokens")]

    [Authorize(Policy = PolicyNames.RequireAdmin)]

    public async Task<IActionResult> GrantTokens(Guid id, [FromBody] GrantTokensRequest request, CancellationToken cancellationToken)

    {

        await _adminUserService.GrantTokensAsync(id, request, cancellationToken);

        return Ok(new { message = "Tokens granted" });

    }

}

