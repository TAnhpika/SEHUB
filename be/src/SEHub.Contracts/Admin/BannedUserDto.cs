namespace SEHub.Contracts.Admin;

public sealed class BannedUserDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string BanType { get; init; } = string.Empty;
    public DateTime? Until { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string? ActorUsername { get; init; }
}
