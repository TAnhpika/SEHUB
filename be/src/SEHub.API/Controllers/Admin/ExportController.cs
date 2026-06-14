using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/export")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class ExportController : ControllerBase
{
    private readonly IAdminExportService _exportService;

    public ExportController(IAdminExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("dashboard.csv")]
    public async Task<IActionResult> ExportDashboard(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportDashboardCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("users.csv")]
    public async Task<IActionResult> ExportUsers(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportUsersCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("payments.csv")]
    public async Task<IActionResult> ExportPayments(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportPaymentsCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("reports.csv")]
    public async Task<IActionResult> ExportReports(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportReportsCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("violations.csv")]
    public async Task<IActionResult> ExportViolations(CancellationToken cancellationToken)
    {
        var (content, fileName) = await _exportService.ExportViolationsCsvAsync(cancellationToken);
        return File(content, "text/csv; charset=utf-8", fileName);
    }
}
