using Microsoft.Extensions.Configuration;

using Microsoft.Extensions.Hosting;

using SEHub.Application.Abstractions;

using System.Text.Json;



namespace SEHub.Infrastructure.Payments;



public class PayOsService : IPayOsService

{

    private readonly IConfiguration _configuration;

    private readonly IHostEnvironment _environment;



    public PayOsService(IConfiguration configuration, IHostEnvironment environment)

    {

        _configuration = configuration;

        _environment = environment;

    }



    public Task<PayOsOrderResult> CreatePaymentLinkAsync(

        Guid orderId, string payOsOrderCode, decimal amount, string description,

        CancellationToken cancellationToken = default)

    {

        var qrUrl = $"https://pay.payos.vn/web/mock/{payOsOrderCode}?amount={amount}";

        var checkoutUrl = $"https://pay.payos.vn/web/mock/checkout/{payOsOrderCode}";



        return Task.FromResult(new PayOsOrderResult

        {

            QrUrl = qrUrl,

            CheckoutUrl = checkoutUrl

        });

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

}

