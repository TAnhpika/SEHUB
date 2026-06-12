namespace SEHub.Contracts.Admin;

public sealed class ViolatingUserDetailDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Major { get; init; }
    public int? Semester { get; init; }
    public string? LevelName { get; init; }
    public int Points { get; init; }
    public int ViolationCount { get; init; }
    public int WarningCount { get; init; }
    public int TempBanCount { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? BanType { get; init; }
    public DateTime? BanUntil { get; init; }
    public int? LockDurationDays { get; init; }
    public string? BanReason { get; init; }
    public DateTime? LastActionAt { get; init; }
    public IReadOnlyList<ViolationHistoryItemDto> History { get; init; } = [];
}
