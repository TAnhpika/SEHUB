namespace SEHub.Contracts.Premium;

public sealed class N8NPremiumActivationDto
{
    public string OrderCode { get; init; } = string.Empty;

    public decimal Amount { get; init; }

    public string PackageName { get; init; } = string.Empty;

    public string? Username { get; init; }

    public Guid? UserId { get; init; }
}
