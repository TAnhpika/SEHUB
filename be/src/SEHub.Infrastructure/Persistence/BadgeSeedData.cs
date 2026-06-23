using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Application.Gamification;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

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
        (Guid.Parse("b100000b-0000-0000-0000-00000000000b"), "helpful-peer", "Helpful Peer",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerCommentsCreated, TriggerValue = 25, Description = "Góp ý hữu ích cho 25 bình luận" }),
        (Guid.Parse("b100000c-0000-0000-0000-00000000000c"), "community-star", "Community Star",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPostsPublished, TriggerValue = 25, Description = "Đóng góp 25 bài viết cộng đồng" }),
        (Guid.Parse("b100000d-0000-0000-0000-00000000000d"), "exam-legend", "Exam Legend",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerExamsCompleted, TriggerValue = 50, Description = "Hoàn thành 50 bài thi trắc nghiệm" }),
        (Guid.Parse("b100000e-0000-0000-0000-00000000000e"), "perfect-streak", "Perfect Streak",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPerfectExams, TriggerValue = 10, Description = "Đạt điểm tuyệt đối 10 lần" }),
        (Guid.Parse("b100000f-0000-0000-0000-00000000000f"), "practice-pro", "Practice Pro",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPracticeSubmissions, TriggerValue = 5, Description = "Nộp 5 bài thực hành" }),
        (Guid.Parse("b1000010-0000-0000-0000-000000000010"), "streak-master", "Streak Master",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerStreakDays, TriggerValue = 30, Description = "Duy trì streak 30 ngày" }),
        (Guid.Parse("b1000011-0000-0000-0000-000000000011"), "streak-champion", "Streak Champion",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerStreakDays, TriggerValue = 60, Description = "Duy trì streak 60 ngày" }),
        (Guid.Parse("b1000012-0000-0000-0000-000000000012"), "comment-king", "Comment King",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerCommentsCreated, TriggerValue = 100, Description = "Viết 100 bình luận hữu ích" }),
        (Guid.Parse("b1000013-0000-0000-0000-000000000013"), "early-bird", "Early Bird",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerStreakDays, TriggerValue = 3, Description = "Duy trì streak 3 ngày liên tiếp" }),
        (Guid.Parse("b1000014-0000-0000-0000-000000000014"), "marathon-learner", "Marathon Learner",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerExamsCompleted, TriggerValue = 100, Description = "Hoàn thành 100 bài thi trắc nghiệm" }),
        (Guid.Parse("b1000015-0000-0000-0000-000000000015"), "high-achiever", "High Achiever",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerHighScoreExams, TriggerValue = 20, MinScore = 80, Description = "Đạt điểm cao 20 bài thi" }),
        (Guid.Parse("b1000016-0000-0000-0000-000000000016"), "dedicated-student", "Dedicated Student",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerStreakDays, TriggerValue = 14, Description = "Duy trì streak 14 ngày" }),
        (Guid.Parse("b1000017-0000-0000-0000-000000000017"), "content-creator", "Content Creator",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPostsPublished, TriggerValue = 50, Description = "Xuất bản 50 bài viết" }),
        (Guid.Parse("b1000018-0000-0000-0000-000000000018"), "practice-veteran", "Practice Veteran",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerPracticeSubmissions, TriggerValue = 10, Description = "Nộp 10 bài thực hành" }),
        (Guid.Parse("b1000019-0000-0000-0000-000000000019"), "social-butterfly", "Social Butterfly",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerCommentsCreated, TriggerValue = 50, Description = "Tham gia 50 bình luận thảo luận" }),
        (Guid.Parse("b100001a-0000-0000-0000-00000000001a"), "sehub-legend", "SEHub Legend",
            new BadgeCondition { TriggerType = BadgeCheckService.TriggerExamsCompleted, TriggerValue = 200, Description = "Hoàn thành 200 bài thi trắc nghiệm" }),
    ];

    internal static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        var existing = await context.Badges.ToDictionaryAsync(b => b.Code, StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        var added = 0;
        var updated = 0;

        foreach (var item in Badges)
        {
            var conditionJson = JsonSerializer.Serialize(item.Condition);
            if (existing.TryGetValue(item.Code, out var badge))
            {
                var changed = badge.Name != item.Name || badge.ConditionJson != conditionJson;
                if (changed)
                {
                    badge.Name = item.Name;
                    badge.ConditionJson = conditionJson;
                    badge.UpdatedAt = now;
                    updated++;
                }

                continue;
            }

            context.Badges.Add(new Badge
            {
                Id = item.Id,
                Code = item.Code,
                Name = item.Name,
                ConditionJson = conditionJson,
                CreatedAt = now,
            });
            added++;
        }

        if (added > 0 || updated > 0)
        {
            await context.SaveChangesAsync();
        }

        logger.LogInformation(
            "Gamification badges synced: {Added} added, {Updated} updated (expected {Expected})",
            added,
            updated,
            GamificationConstants.ExpectedBadgeCount);
    }
}
