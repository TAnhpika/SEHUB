using Microsoft.AspNetCore.Identity;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public int Points { get; set; }
    public Guid? LevelId { get; set; }
    public int StreakCount { get; set; }
    public int HighestStreak { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public DateTime? LastDailyLoginBonusAt { get; set; }
    public bool IsBanned { get; set; }
    public DateTime? BanUntil { get; set; }
    public string? BanReason { get; set; }

    public LevelConfig? Level { get; set; }
    public UserProfile? Profile { get; set; }
}
