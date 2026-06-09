namespace SEHub.Contracts.Premium;

public sealed class SubscriptionStatusDto
{
    public bool IsActive { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? PlanName { get; init; }
}
