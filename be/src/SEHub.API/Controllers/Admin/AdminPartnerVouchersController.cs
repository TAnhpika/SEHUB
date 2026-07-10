using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Abstractions;
using SEHub.Application.Premium;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/partner-vouchers")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class AdminPartnerVouchersController : ControllerBase
{
    private readonly IPartnerVoucherService _partnerVoucherService;
    private readonly ICurrentUserService _currentUser;

    public AdminPartnerVouchersController(
        IPartnerVoucherService partnerVoucherService,
        ICurrentUserService currentUser)
    {
        _partnerVoucherService = partnerVoucherService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? typeCode,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _partnerVoucherService.AdminListAsync(
            status, typeCode, search, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("types")]
    public async Task<IActionResult> ListTypes(CancellationToken cancellationToken)
    {
        var result = await _partnerVoucherService.ListTypesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("inventory")]
    public async Task<IActionResult> Inventory(CancellationToken cancellationToken)
    {
        var result = await _partnerVoucherService.GetInventoryStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(
        [FromBody] ImportPartnerVoucherRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _partnerVoucherService.ImportAsync(request, adminId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("assign")]
    public async Task<IActionResult> Assign(
        [FromBody] AssignPartnerVoucherRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _partnerVoucherService.ManualAssignAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/revoke")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken cancellationToken)
    {
        await _partnerVoucherService.RevokeAsync(id, cancellationToken);
        return Ok(new { message = "Partner voucher revoked" });
    }
}
