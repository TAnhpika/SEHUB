namespace SEHub.Contracts.Premium;

public sealed class SubscriptionPlanDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int DurationDays { get; init; }
    public decimal PriceVnd { get; init; }
}
