namespace SEHub.Contracts.Profiles;

public sealed class BadgeDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public DateTime? EarnedAt { get; init; }
}
