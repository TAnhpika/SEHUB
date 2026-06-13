using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Application.Gamification;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence;

internal static class BadgeSeedData
{
    internal static readonly (Guid Id, string Code, string Name, BadgeCondition Condition)[] Badges =
    [
        (Guid.Parse("b1000001-0000-0000-0000-000000000001"), "first-blogger", "First Blogger",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPostsPublished, TriggerValue = 1, Description = "Viết bài blog đầu tiên" }),
        (Guid.Parse("b1000002-0000-0000-0000-000000000002"), "fresh-dev", "Fresh Dev",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerExamsCompleted, TriggerValue = 1, Description = "Hoàn thành bài thi đầu tiên" }),
        (Guid.Parse("b1000003-0000-0000-0000-000000000003"), "active-learner", "Active Learner",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerCommentsCreated, TriggerValue = 10, Description = "Tham gia thảo luận tích cực" }),
        (Guid.Parse("b1000004-0000-0000-0000-000000000004"), "advanced-contributor", "Advanced Contributor",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPostsPublished, TriggerValue = 10, Description = "Đóng góp 10 bài viết chất lượng" }),
        (Guid.Parse("b1000005-0000-0000-0000-000000000005"), "elite-engineer", "Elite Engineer",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerHighScoreExams, TriggerValue = 5, MinScore = 80, Description = "Đạt điểm cao trong 5 bài thi" }),
        (Guid.Parse("b1000006-0000-0000-0000-000000000006"), "first-challenger", "First Challenger",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPracticeSubmissions, TriggerValue = 1, Description = "Hoàn thành thử thách đầu tiên" }),
        (Guid.Parse("b1000007-0000-0000-0000-000000000007"), "hardworking-coder", "Hardworking Coder",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerStreakDays, TriggerValue = 7, Description = "Duy trì streak 7 ngày" }),
        (Guid.Parse("b1000008-0000-0000-0000-000000000008"), "exam-grinder", "Exam Grinder",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerExamsCompleted, TriggerValue = 20, Description = "Làm 20 bài thi trắc nghiệm" }),
        (Guid.Parse("b1000009-0000-0000-0000-000000000009"), "test-grandmaster", "Test Grandmaster",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPerfectExams, TriggerValue = 3, Description = "Đạt điểm tuyệt đối 3 lần" }),
        (Guid.Parse("b100000a-0000-0000-0000-00000000000a"), "discussion-starter", "Discussion Starter",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPostsPublished, TriggerValue = 5, Description = "Mở 5 chủ đề thảo luận mới" }),
    ];

    internal static async Task SeedAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.Badges.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;
        var entities = Badges.Select(item => new Badge
        {
            Id = item.Id,
            Code = item.Code,
            Name = item.Name,
            ConditionJson = JsonSerializer.Serialize(item.Condition),
            CreatedAt = now
        }).ToList();

        context.Badges.AddRange(entities);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} gamification badges", entities.Count);
    }
}
