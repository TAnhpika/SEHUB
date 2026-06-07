using System.Text;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using SEHub.API.Filters;

using SEHub.Application.Abstractions;

using SEHub.Application.Premium;

using SEHub.Contracts.Premium;

using SEHub.Shared.Constants;



namespace SEHub.API.Controllers;



[ApiController]

[Route("api/v1/premium")]

public sealed class PremiumController : ControllerBase

{

    private readonly IPremiumService _premiumService;

    private readonly IPayOsWebhookHandler _payOsWebhookHandler;



    public PremiumController(IPremiumService premiumService, IPayOsWebhookHandler payOsWebhookHandler)

    {

        _premiumService = premiumService;

        _payOsWebhookHandler = payOsWebhookHandler;

    }



    [HttpGet("plans")]

    [AllowAnonymous]

    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)

    {

        var result = await _premiumService.GetPlansAsync(cancellationToken);

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

    public async Task<IActionResult> GetOrder(Guid orderId, CancellationToken cancellationToken)

    {

        var result = await _premiumService.GetOrderAsync(orderId, cancellationToken);

        return Ok(result);

    }



    [HttpGet("subscription")]

    [Authorize(Policy = PolicyNames.RequireAuthenticated)]

    public async Task<IActionResult> GetSubscription(CancellationToken cancellationToken)

    {

        var result = await _premiumService.GetSubscriptionAsync(cancellationToken);

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

}

