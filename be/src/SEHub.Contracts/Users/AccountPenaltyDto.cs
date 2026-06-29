namespace SEHub.Contracts.Users;

public sealed class AccountPenaltyDto
{
    public Guid Id { get; init; }
    public string PenaltyType { get; init; } = string.Empty;
    public string PenaltyTypeLabel { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public DateTime IssuedAt { get; init; }
    public DateTime? Until { get; init; }
    public string UntilLabel { get; init; } = string.Empty;
}
