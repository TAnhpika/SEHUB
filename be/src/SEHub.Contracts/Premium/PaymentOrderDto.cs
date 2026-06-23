namespace SEHub.Contracts.Premium;

public sealed class PaymentOrderDto
{
    public Guid OrderId { get; init; }
    public string PayOsOrderCode { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public decimal OriginalAmount { get; init; }
    public int? DiscountPercent { get; init; }
    public string? DiscountSource { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? QrUrl { get; init; }
    public string? CheckoutUrl { get; init; }
    public DateTime ExpiredAt { get; init; }
    public string? PlanCode { get; init; }
    public DateTime? PaidAt { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public string? VerificationMethod { get; init; }
    public string? Message { get; init; }
}
