using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class DashboardController : ControllerBase
{
    private readonly IAdminDashboardService _dashboardService;
    private readonly IAdminDashboardChartsService _chartsService;

    public DashboardController(
        IAdminDashboardService dashboardService,
        IAdminDashboardChartsService chartsService)
    {
        _dashboardService = dashboardService;
        _chartsService = chartsService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts(
        [FromQuery] string period = "month",
        CancellationToken cancellationToken = default)
    {
        var result = await _chartsService.GetChartsAsync(period, cancellationToken);
        return Ok(result);
    }
}
