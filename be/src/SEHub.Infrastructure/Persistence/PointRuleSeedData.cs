using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence;

internal static class PointRuleSeedData
{
    internal static readonly (string Code, string EventType, int Points, string Description)[] Rules =
    [
        ("post-published", GamificationConstants.EventPostPublished, 10, "Đăng bài được duyệt"),
        ("like-received", GamificationConstants.EventLikeReceived, 2, "Nhận like"),
        ("like-removed", GamificationConstants.EventLikeRemoved, -2, "Hủy like"),
        ("comment-created", GamificationConstants.EventCommentCreated, 1, "Bình luận"),
        ("comment-deleted", GamificationConstants.EventCommentDeleted, -1, "Xóa bình luận"),
        ("daily-login", GamificationConstants.EventDailyLogin, 2, "Đăng nhập ngày mới"),
        ("streak-milestone-7", GamificationConstants.EventStreakMilestone7, 20, "Streak 7 ngày"),
        ("exam-completed", GamificationConstants.EventExamCompleted, 15, "Hoàn thành đề thi"),
        ("document-approved", GamificationConstants.EventDocumentApproved, 30, "Tài liệu được duyệt"),
        ("ai-used", GamificationConstants.EventAiUsed, 3, "Sử dụng AI học tập"),
        ("document-read", GamificationConstants.EventDocumentRead, 2, "Đọc tài liệu"),
        ("feedback-resolved", GamificationConstants.EventFeedbackResolved, 50, "Phản hồi / báo lỗi được xử lý"),
    ];

    internal static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        foreach (var (code, eventType, points, description) in Rules)
        {
            var existing = await context.PointRules.FirstOrDefaultAsync(r => r.Code == code);
            if (existing is null)
            {
                context.PointRules.Add(new PointRule
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    EventType = eventType,
                    Points = points,
                    IsActive = true,
                    Description = description,
                    CreatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded point rule {Code}", code);
            }
            else
            {
                existing.EventType = eventType;
                existing.Points = points;
                existing.Description = description;
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await context.SaveChangesAsync();
    }
}
