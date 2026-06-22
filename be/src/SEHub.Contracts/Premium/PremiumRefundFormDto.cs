namespace SEHub.Contracts.Premium;

public sealed class PremiumRefundFormDto
{
    public string OrderCode { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? PlanName { get; init; }
    public decimal Amount { get; init; }
    public bool BankDetailsSubmitted { get; init; }
    public string? Message { get; init; }
}
