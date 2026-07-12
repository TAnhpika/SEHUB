using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/role-audits")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class RoleAuditsController : ControllerBase
{
    private readonly IRoleChangeAuditService _roleChangeAuditService;

    public RoleAuditsController(IRoleChangeAuditService roleChangeAuditService)
    {
        _roleChangeAuditService = roleChangeAuditService;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _roleChangeAuditService.ListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }
}
