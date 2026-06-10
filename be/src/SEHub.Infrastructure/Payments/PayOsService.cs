using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Payments;

public class PayOsService : IPayOsService
{
    private const string PayOsApiBase = "https://api-merchant.payos.vn";
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

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
        PayOsCheckoutUrls? checkoutUrls = null,
        CancellationToken cancellationToken = default)
    {
        if (IsMockMode())
        {
            return CreateMockResult(payOsOrderCode, amount, checkoutUrls);
        }

        if (!long.TryParse(payOsOrderCode, out var orderCode))
        {
            orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        var clientId = _configuration["PayOS:ClientId"] ?? throw new DomainException("PayOS ClientId is not configured.");
        var apiKey = _configuration["PayOS:ApiKey"] ?? throw new DomainException("PayOS ApiKey is not configured.");
        var checksumKey = _configuration["PayOS:ChecksumKey"] ?? throw new DomainException("PayOS ChecksumKey is not configured.");
        var returnUrl = checkoutUrls?.ReturnUrl
            ?? _configuration["PayOS:ReturnUrl"]
            ?? "http://localhost:5173/home/premium/success/trial";
        var cancelUrl = checkoutUrls?.CancelUrl
            ?? _configuration["PayOS:CancelUrl"]
            ?? "http://localhost:5173/home/premium";
        var amountInt = (int)amount;
        var safeDescription = TruncateDescription(description);

        var signature = PayOsSignatureHelper.CreatePaymentRequestSignature(
            orderCode,
            amountInt,
            safeDescription,
            returnUrl,
            cancelUrl,
            checksumKey);

        var requestBody = new
        {
            orderCode,
            amount = amountInt,
            description = safeDescription,
            returnUrl,
            cancelUrl,
            signature,
        };

        var client = _httpClientFactory.CreateClient(nameof(PayOsService));
        client.DefaultRequestHeaders.Remove("x-client-id");
        client.DefaultRequestHeaders.Remove("x-api-key");
        client.DefaultRequestHeaders.Add("x-client-id", clientId);
        client.DefaultRequestHeaders.Add("x-api-key", apiKey);

        using var response = await client.PostAsJsonAsync(
            $"{PayOsApiBase}/v2/payment-requests",
            requestBody,
            JsonOptions,
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("PayOS create payment failed: {Status} {Body}", response.StatusCode, raw);
            throw new DomainException("Không tạo được link thanh toán PayOS.");
        }

        using var document = JsonDocument.Parse(raw);
        var root = document.RootElement;
        var code = root.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;
        if (!string.Equals(code, "00", StringComparison.Ordinal))
        {
            var desc = root.TryGetProperty("desc", out var descEl) ? descEl.GetString() : raw;
            _logger.LogWarning("PayOS create payment rejected: {Desc}", desc);
            throw new DomainException(desc ?? "PayOS từ chối tạo đơn thanh toán.");
        }

        if (!root.TryGetProperty("data", out var data))
        {
            throw new DomainException("PayOS không trả dữ liệu checkout.");
        }

        var checkoutUrl = data.TryGetProperty("checkoutUrl", out var checkoutEl)
            ? checkoutEl.GetString() ?? string.Empty
            : string.Empty;
        var qrCode = data.TryGetProperty("qrCode", out var qrEl)
            ? qrEl.GetString() ?? checkoutUrl
            : checkoutUrl;

        return new PayOsOrderResult
        {
            QrUrl = qrCode,
            CheckoutUrl = checkoutUrl,
        };
    }

    public bool VerifyWebhookSignature(string rawBody, string signature)
    {
        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        var checksumKey = _configuration["PayOS:ChecksumKey"] ?? "mock-checksum-key-dev";

        if (IsMockMode() && (_environment.IsDevelopment() || _environment.EnvironmentName.Equals("Testing", StringComparison.OrdinalIgnoreCase)))
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

    private bool IsMockMode()
    {
        var clientId = _configuration["PayOS:ClientId"];
        return string.IsNullOrWhiteSpace(clientId)
            || clientId.Equals("mock-client-id", StringComparison.OrdinalIgnoreCase);
    }

    private static PayOsOrderResult CreateMockResult(
        string payOsOrderCode,
        decimal amount,
        PayOsCheckoutUrls? checkoutUrls)
    {
        return new PayOsOrderResult
        {
            QrUrl = $"00020101021238570010A0000007270127000697040301QRIBFTTA53037045404{amount}5802VN62190815MOCK{payOsOrderCode}6304ABCD",
            CheckoutUrl = checkoutUrls?.ReturnUrl
                ?? $"https://pay.payos.vn/web/mock/checkout/{payOsOrderCode}",
        };
    }

    private static string TruncateDescription(string description)
    {
        var trimmed = description.Trim();
        return trimmed.Length <= 25 ? trimmed : trimmed[..25];
    }
}
