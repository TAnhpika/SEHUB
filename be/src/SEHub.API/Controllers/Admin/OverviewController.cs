using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/overview")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class OverviewController : ControllerBase
{
    private readonly IAdminOverviewService _overviewService;

    public OverviewController(IAdminOverviewService overviewService)
    {
        _overviewService = overviewService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _overviewService.GetOverviewAsync(cancellationToken);
        return Ok(result);
    }
}
