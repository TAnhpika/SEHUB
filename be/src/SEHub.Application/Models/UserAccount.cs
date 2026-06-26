namespace SEHub.Application.Models;

public sealed class UserAccount
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool EmailConfirmed { get; init; }
    public string? PhoneNumber { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsBanned { get; init; }
    public DateTime? BanUntil { get; init; }
    public string? BanReason { get; init; }
    public int Points { get; init; }
    public Guid? LevelId { get; init; }
    public string? LevelName { get; init; }
    public int StreakCount { get; init; }
    public int HighestStreak { get; init; }
    public DateTime? LastActivityDate { get; init; }
    public DateTime? LastDailyLoginBonusAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class CreateUserModel
{
    public string Email { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public bool EmailConfirmed { get; init; }
}

public sealed class UserSummary
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
}
