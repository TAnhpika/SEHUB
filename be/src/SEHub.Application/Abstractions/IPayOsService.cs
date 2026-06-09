using SEHub.Contracts.Premium;

namespace SEHub.Application.Abstractions;

public interface IPayOsService
{
    Task<PayOsOrderResult> CreatePaymentLinkAsync(Guid orderId, string payOsOrderCode, decimal amount, string description, CancellationToken cancellationToken = default);
    bool VerifyWebhookSignature(string rawBody, string signature);
}

public sealed class PayOsOrderResult
{
    public string QrUrl { get; init; } = string.Empty;
    public string CheckoutUrl { get; init; } = string.Empty;
}
