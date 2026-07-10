using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Premium;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/me/partner-vouchers")]
[Authorize]
public sealed class PartnerVouchersController : ControllerBase
{
    private readonly IPartnerVoucherService _partnerVoucherService;

    public PartnerVouchersController(IPartnerVoucherService partnerVoucherService)
    {
        _partnerVoucherService = partnerVoucherService;
    }

    [HttpGet]
    public async Task<IActionResult> ListMine(CancellationToken cancellationToken)
    {
        var result = await _partnerVoucherService.ListMyAsync(cancellationToken);
        return Ok(result);
    }
}
