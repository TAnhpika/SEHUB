using System.Text;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using Microsoft.Extensions.Options;

using SEHub.API.Filters;

using SEHub.Application.Abstractions;

using SEHub.Application.Premium;

using SEHub.Contracts.Premium;

using SEHub.Infrastructure.Notifications;

using SEHub.Shared.Constants;



namespace SEHub.API.Controllers;



[ApiController]

[Route("api/v1/premium")]

public sealed class PremiumController : ControllerBase

{

    private readonly IPremiumService _premiumService;

    private readonly IPremiumRefundService _premiumRefundService;

    private readonly IPayOsWebhookHandler _payOsWebhookHandler;

    private readonly IN8nPremiumActivationService _n8nPremiumActivationService;

    private readonly IOptions<N8nSettings> _n8nSettings;



    public PremiumController(

        IPremiumService premiumService,

        IPremiumRefundService premiumRefundService,

        IPayOsWebhookHandler payOsWebhookHandler,

        IN8nPremiumActivationService n8nPremiumActivationService,

        IOptions<N8nSettings> n8nSettings)

    {

        _premiumService = premiumService;

        _premiumRefundService = premiumRefundService;

        _payOsWebhookHandler = payOsWebhookHandler;

        _n8nPremiumActivationService = n8nPremiumActivationService;

        _n8nSettings = n8nSettings;

    }



    [HttpGet("plans")]

    [AllowAnonymous]

    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)

    {

        var result = await _premiumService.GetPlansAsync(cancellationToken);

        return Ok(result);

    }



    [HttpGet("rank-voucher")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetRankVoucher(
        [FromQuery] string? planCode,
        CancellationToken cancellationToken)
    {
        var result = await _premiumService.GetRankVoucherPreviewAsync(planCode, cancellationToken);
        return Ok(result);
    }

    [HttpPost("orders")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> CreateOrder([FromBody] CreatePaymentOrderRequest request, CancellationToken cancellationToken)

    {

        var result = await _premiumService.CreateOrderAsync(request, cancellationToken);

        return Ok(result);

    }



    [HttpGet("orders/{orderId:guid}")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> GetOrder(
        Guid orderId,
        CancellationToken cancellationToken,
        [FromQuery] bool markWaitingConfirmation = false)

    {

        var result = await _premiumService.GetOrderAsync(orderId, markWaitingConfirmation, cancellationToken);

        return Ok(result);

    }



    [HttpGet("subscription")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> GetSubscription(CancellationToken cancellationToken)

    {

        var result = await _premiumService.GetSubscriptionAsync(cancellationToken);

        return Ok(result);

    }



    [HttpPost("orders/{orderId:guid}/dev/confirm")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> ConfirmDevPayment(Guid orderId, CancellationToken cancellationToken)

    {

        var result = await _premiumService.ConfirmDevPaymentAsync(orderId, cancellationToken);

        return Ok(result);

    }



    [HttpPost("refund")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> RequestRefund(

        [FromBody] PremiumRefundRequestDto request,

        CancellationToken cancellationToken)

    {

        var result = await _premiumRefundService.RequestRefundAsync(request, cancellationToken);

        return Ok(result);

    }

    [HttpGet("refund/form")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetRefundForm(
        [FromQuery] string orderCode,
        CancellationToken cancellationToken)
    {
        var result = await _premiumRefundService.GetRefundFormAsync(orderCode, cancellationToken);
        return Ok(result);
    }

    [HttpPost("refund/bank-details")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(55 * 1024 * 1024)]
    public async Task<IActionResult> SubmitRefundBankDetails(
        [FromForm] PremiumRefundBankDetailsRequest request,
        [FromForm] IFormFileCollection? files,
        CancellationToken cancellationToken)
    {
        var paymentProofs = new List<RefundPaymentProofUpload>();
        if (files is not null)
        {
            foreach (var file in files)
            {
                if (file.Length <= 0)
                {
                    continue;
                }

                paymentProofs.Add(new RefundPaymentProofUpload
                {
                    Content = file.OpenReadStream(),
                    FileName = file.FileName,
                    ContentType = file.ContentType ?? string.Empty,
                    SizeBytes = file.Length,
                });
            }
        }

        var result = await _premiumRefundService.SubmitRefundBankDetailsAsync(
            request,
            paymentProofs,
            cancellationToken);
        return Ok(result);
    }



    [HttpPost("webhooks/payos")]

    [AllowAnonymous]

    [SkipApiEnvelope]

    public async Task<IActionResult> PayOsWebhook(CancellationToken cancellationToken)

    {

        using var reader = new StreamReader(Request.Body, Encoding.UTF8);

        var rawBody = await reader.ReadToEndAsync(cancellationToken);



        var payload = System.Text.Json.JsonSerializer.Deserialize<PayOsWebhookPayload>(rawBody,

            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });



        if (payload is null)

        {

            return Unauthorized();

        }



        var success = await _payOsWebhookHandler.HandleAsync(rawBody, payload.Signature ?? string.Empty, cancellationToken);

        return success ? Ok() : Unauthorized();

    }



    [HttpPost("activate")]

    [AllowAnonymous]

    public async Task<IActionResult> ActivateFromN8n(

        [FromBody] N8NPremiumActivationDto request,

        CancellationToken cancellationToken)

    {

        if (!IsInboundSecretValid())

        {

            return Unauthorized();

        }



        var result = await _n8nPremiumActivationService.ActivateAsync(request, cancellationToken);

        return Ok(result);

    }



    private bool IsInboundSecretValid()

    {

        var configuredSecret = _n8nSettings.Value.InboundSecretKey;

        if (string.IsNullOrWhiteSpace(configuredSecret))

        {

            return false;

        }



        if (!Request.Headers.TryGetValue("X-SEHUB-SECRET-KEY", out var providedSecret))

        {

            return false;

        }



        return string.Equals(providedSecret.ToString(), configuredSecret, StringComparison.Ordinal);

    }

}

