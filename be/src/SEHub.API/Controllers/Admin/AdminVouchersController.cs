using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/vouchers")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class AdminVouchersController : ControllerBase
{
    private readonly IAdminVoucherService _voucherService;

    public AdminVouchersController(IAdminVoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _voucherService.ListAsync(status, search, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("grant")]
    public async Task<IActionResult> Grant(
        [FromBody] GrantAdminVoucherRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _voucherService.GrantAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/revoke")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken cancellationToken)
    {
        await _voucherService.RevokeAsync(id, cancellationToken);
        return Ok(new { message = "Voucher revoked" });
    }
}
