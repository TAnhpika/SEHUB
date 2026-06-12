namespace SEHub.Contracts.Admin;

public sealed class ViolatingUserDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Major { get; init; }
    public int ViolationCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? BanType { get; init; }
    public DateTime? BanUntil { get; init; }
    public string? BanReason { get; init; }
    public DateTime? LastActionAt { get; init; }
}
