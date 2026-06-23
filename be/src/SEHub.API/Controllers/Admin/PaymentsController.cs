using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/payments")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class PaymentsController : ControllerBase
{
    private readonly IAdminPaymentService _adminPaymentService;

    public PaymentsController(IAdminPaymentService adminPaymentService)
    {
        _adminPaymentService = adminPaymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _adminPaymentService.GetPaymentsAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _adminPaymentService.GetAuditLogsAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPayment(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminPaymentService.GetPaymentAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{orderId:guid}/confirm")]
    public async Task<IActionResult> ConfirmPayment(Guid orderId, [FromBody] ConfirmPaymentRequest request, CancellationToken cancellationToken)
    {
        await _adminPaymentService.ConfirmPaymentAsync(orderId, request, cancellationToken);
        return Ok(new { message = "Payment confirmed" });
    }

    [HttpPost("{orderId:guid}/refund/approve")]
    public async Task<IActionResult> ApproveRefund(
        Guid orderId,
        [FromBody] ApproveRefundRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminPaymentService.ApproveRefundAsync(orderId, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{orderId:guid}/refund/complete")]
    public async Task<IActionResult> CompleteRefund(
        Guid orderId,
        [FromBody] ApproveRefundRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _adminPaymentService.CompleteRefundAsync(orderId, request, cancellationToken);
        return Ok(result);
    }
}
