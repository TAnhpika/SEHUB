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
        ("daily-comment-3", "Bình luận 3 lần", GamificationConstants.EventCommentCreated, 3, 8),
        ("daily-comment-5", "Bình luận 5 lần", GamificationConstants.EventCommentCreated, 5, 15),
        ("daily-read", "Đọc tài liệu", GamificationConstants.EventDocumentRead, 1, 5),
        ("daily-read-2", "Đọc 2 tài liệu", GamificationConstants.EventDocumentRead, 2, 8),
        ("daily-read-3", "Đọc 3 tài liệu", GamificationConstants.EventDocumentRead, 3, 12),
        ("daily-exam-1", "Hoàn thành 1 đề thi", GamificationConstants.EventExamCompleted, 1, 10),
        ("daily-exam-2", "Hoàn thành 2 đề thi", GamificationConstants.EventExamCompleted, 2, 18),
        ("daily-ai-1", "Dùng AI 1 lần", GamificationConstants.EventAiUsed, 1, 5),
        ("daily-ai-3", "Dùng AI 3 lần", GamificationConstants.EventAiUsed, 3, 12),
        ("daily-post-1", "Đăng bài được duyệt", GamificationConstants.EventPostPublished, 1, 15),
        ("daily-like-3", "Nhận 3 lượt thích", GamificationConstants.EventLikeReceived, 3, 8),
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
