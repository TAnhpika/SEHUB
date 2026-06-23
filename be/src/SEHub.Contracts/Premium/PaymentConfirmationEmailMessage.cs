namespace SEHub.Contracts.Premium;

public sealed class PaymentConfirmationEmailMessage
{
    public string ToEmail { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string PlanName { get; init; } = string.Empty;

    public decimal AmountVnd { get; init; }

    public string OrderCode { get; init; } = string.Empty;

    public DateTime? ExpiresAt { get; init; }

    public string AppHomeUrl { get; init; } = "http://localhost:5173/home";
}
