namespace SEHub.Contracts.Premium;

public sealed class N8nPremiumActivationResultDto
{
    public Guid UserId { get; init; }

    public string Username { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public bool IsPremium { get; init; }

    public string PlanName { get; init; } = string.Empty;

    public DateTime? ExpiresAt { get; init; }

    public string OrderCode { get; init; } = string.Empty;

    public decimal Amount { get; init; }

    public int AiDailyTokenLimit { get; init; }

    public bool AlreadyProcessed { get; init; }
}
