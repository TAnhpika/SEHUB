namespace SEHub.Contracts.Premium;

public sealed class PaymentPaidNotification
{
    public string Event { get; init; } = "premium.payment.paid";

    public Guid UserId { get; init; }

    public string UserEmail { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public Guid OrderId { get; init; }

    public string PayOsOrderCode { get; init; } = string.Empty;

    public Guid PlanId { get; init; }

    public string PlanName { get; init; } = string.Empty;

    public decimal AmountVnd { get; init; }

    public DateTime PaidAt { get; init; }

    public DateTime? ExpiresAt { get; init; }
}
