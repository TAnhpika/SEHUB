namespace SEHub.Contracts.Admin;

public sealed class PaymentListItemDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string? UserEmail { get; init; }
    public string PayOsOrderCode { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? PlanName { get; init; }
    public string? PlanCode { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? PaidAt { get; init; }
    public string? RefundRequestReason { get; init; }
    public DateTime? RefundRequestedAt { get; init; }
}
