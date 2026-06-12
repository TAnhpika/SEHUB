namespace SEHub.Contracts.Premium;

public sealed class SubscriptionStatusDto
{
    public bool IsActive { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? PlanName { get; init; }
    public string? LatestPaidOrderCode { get; init; }
    public DateTime? LastPaidAt { get; init; }
    public bool CanRequestRefund { get; init; }
    public bool HasPendingRefundRequest { get; init; }
}
