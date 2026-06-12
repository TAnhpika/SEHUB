namespace SEHub.Contracts.Admin;

public sealed class AdminUserPatchRequest
{
    public DateTime? BanUntil { get; init; }
    public string? BanType { get; init; }
    public string? Role { get; init; }
    public bool? IsBanned { get; init; }
    public string? BanReason { get; init; }
}
