namespace SEHub.Contracts.Admin;

public sealed class ModeratorBanUserRequest
{
    public int DurationDays { get; init; }
    public string Reason { get; init; } = string.Empty;
}
