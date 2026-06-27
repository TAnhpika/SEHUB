using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/audit-logs")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class AuditLogsController : ControllerBase
{
    private readonly IAdminAuditLogService _auditLogService;

    public AuditLogsController(IAdminAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _auditLogService.GetAuditLogsAsync(type, page, pageSize, cancellationToken);
        return Ok(result);
    }
}
