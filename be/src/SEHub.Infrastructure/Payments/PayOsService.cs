using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Payments;

public class PayOsService : IPayOsService
{
    private const string DefaultApiBaseUrl = "https://api-merchant.payos.vn";
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PayOsService> _logger;

    public PayOsService(
        IConfiguration configuration,
        IHostEnvironment environment,
        IHttpClientFactory httpClientFactory,
        ILogger<PayOsService> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<PayOsOrderResult> CreatePaymentLinkAsync(
        Guid orderId,
        string payOsOrderCode,
        decimal amount,
        string description,
        string returnUrl,
        string cancelUrl,
        CancellationToken cancellationToken = default)
    {
        if (ShouldUseMockProvider())
        {
            return CreateMockResult(payOsOrderCode, amount);
        }

        if (!long.TryParse(payOsOrderCode, out var orderCodeNumeric))
        {
            throw new InvalidOperationException("PayOsOrderCode must be numeric when using the live PayOS API.");
        }

        var clientId = _configuration["PayOS:ClientId"] ?? string.Empty;
        var apiKey = _configuration["PayOS:ApiKey"] ?? string.Empty;
        var checksumKey = _configuration["PayOS:ChecksumKey"] ?? string.Empty;
        var apiBaseUrl = _configuration["PayOS:ApiBaseUrl"] ?? DefaultApiBaseUrl;

        var amountLong = (long)amount;
        var paymentDescription = TruncateDescription(description);
        var signature = PayOsSignatureHelper.CreatePaymentRequestSignature(
            orderCodeNumeric,
            amountLong,
            paymentDescription,
            cancelUrl,
            returnUrl,
            checksumKey);

        var requestBody = new
        {
            orderCode = orderCodeNumeric,
            amount = amountLong,
            description = paymentDescription,
            returnUrl,
            cancelUrl,
            signature
        };

        var client = _httpClientFactory.CreateClient(nameof(PayOsService));
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{apiBaseUrl.TrimEnd('/')}/v2/payment-requests");
        request.Headers.Add("x-client-id", clientId);
        request.Headers.Add("x-api-key", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "PayOS create payment failed. Status={StatusCode}, Body={Body}",
                (int)response.StatusCode,
                responseBody);
            throw new InvalidOperationException("PayOS payment link creation failed.");
        }

        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;
        var code = root.TryGetProperty("code", out var codeElement) ? codeElement.GetString() : null;
        if (!string.Equals(code, "00", StringComparison.OrdinalIgnoreCase)
            || !root.TryGetProperty("data", out var data))
        {
            var desc = root.TryGetProperty("desc", out var descElement) ? descElement.GetString() : responseBody;
            _logger.LogError("PayOS create payment returned error: {Description}", desc);
            throw new InvalidOperationException($"PayOS error: {desc}");
        }

        var checkoutUrl = data.TryGetProperty("checkoutUrl", out var checkoutElement)
            ? checkoutElement.GetString() ?? string.Empty
            : string.Empty;
        var qrCode = data.TryGetProperty("qrCode", out var qrElement)
            ? qrElement.GetString()
            : null;

        return new PayOsOrderResult
        {
            CheckoutUrl = checkoutUrl,
            QrUrl = string.IsNullOrWhiteSpace(checkoutUrl) ? qrCode ?? string.Empty : checkoutUrl,
            QrCodeData = qrCode
        };
    }

    public bool VerifyWebhookSignature(string rawBody, string signature)
    {
        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        var checksumKey = _configuration["PayOS:ChecksumKey"] ?? "mock-checksum-key-dev";

        if (_environment.IsDevelopment() || _environment.EnvironmentName.Equals("Testing", StringComparison.OrdinalIgnoreCase))
        {
            if (signature.Equals($"mock-{checksumKey}", StringComparison.Ordinal))
            {
                return true;
            }
        }

        try
        {
            using var document = JsonDocument.Parse(rawBody);
            return PayOsSignatureHelper.VerifySignature(document.RootElement, signature, checksumKey);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private bool ShouldUseMockProvider()
    {
        var clientId = _configuration["PayOS:ClientId"] ?? string.Empty;
        var apiKey = _configuration["PayOS:ApiKey"] ?? string.Empty;
        return string.IsNullOrWhiteSpace(clientId)
            || string.IsNullOrWhiteSpace(apiKey)
            || clientId.StartsWith("mock-", StringComparison.OrdinalIgnoreCase)
            || apiKey.StartsWith("mock-", StringComparison.OrdinalIgnoreCase);
    }

    private static PayOsOrderResult CreateMockResult(string payOsOrderCode, decimal amount) =>
        new()
        {
            QrUrl = $"https://pay.payos.vn/web/mock/{payOsOrderCode}?amount={amount}",
            CheckoutUrl = $"https://pay.payos.vn/web/mock/checkout/{payOsOrderCode}"
        };

    private static string TruncateDescription(string description) =>
        description.Length <= 25 ? description : description[..25];
}
