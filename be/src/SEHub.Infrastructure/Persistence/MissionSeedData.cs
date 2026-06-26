using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence;

internal static class MissionSeedData
{
    internal static readonly (string Code, string Name, string EventType, int TargetCount, int RewardPoints)[] DailyMissions =
    [
        ("daily-login", "Đăng nhập hôm nay", GamificationConstants.EventDailyLogin, 1, 5),
        ("daily-comment", "Bình luận 1 lần", GamificationConstants.EventCommentCreated, 1, 3),
        ("daily-read", "Đọc tài liệu", GamificationConstants.EventDocumentRead, 1, 5),
    ];

    internal static readonly (string Code, string Name, string EventType, int TargetCount, int RewardPoints)[] WeeklyMissions =
    [
        ("weekly-post", "Đăng bài được duyệt", GamificationConstants.EventPostPublished, 1, 15),
        ("weekly-exam", "Hoàn thành đề thi", GamificationConstants.EventExamCompleted, 2, 25),
        ("weekly-ai", "Dùng AI học tập", GamificationConstants.EventAiUsed, 3, 10),
    ];

    internal static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        foreach (var (code, name, eventType, targetCount, rewardPoints) in DailyMissions)
        {
            var existing = await context.DailyMissions.FirstOrDefaultAsync(m => m.Code == code);
            if (existing is null)
            {
                context.DailyMissions.Add(new DailyMission
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = name,
                    EventType = eventType,
                    TargetCount = targetCount,
                    RewardPoints = rewardPoints,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded daily mission {Code}", code);
            }
            else
            {
                existing.Name = name;
                existing.EventType = eventType;
                existing.TargetCount = targetCount;
                existing.RewardPoints = rewardPoints;
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        foreach (var (code, name, eventType, targetCount, rewardPoints) in WeeklyMissions)
        {
            var existing = await context.WeeklyMissions.FirstOrDefaultAsync(m => m.Code == code);
            if (existing is null)
            {
                context.WeeklyMissions.Add(new WeeklyMission
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = name,
                    EventType = eventType,
                    TargetCount = targetCount,
                    RewardPoints = rewardPoints,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded weekly mission {Code}", code);
            }
            else
            {
                existing.Name = name;
                existing.EventType = eventType;
                existing.TargetCount = targetCount;
                existing.RewardPoints = rewardPoints;
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await context.SaveChangesAsync();
    }
}
