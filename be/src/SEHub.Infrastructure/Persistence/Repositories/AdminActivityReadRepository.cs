using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class AdminActivityReadRepository : IAdminActivityReadRepository
{
    private readonly SEHubDbContext _context;

    public AdminActivityReadRepository(SEHubDbContext context) => _context = context;

    public async Task<AdminActivitySnapshotDto> GetSnapshotAsync(
        int fetchLimit,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(fetchLimit, 20, 500);
        var events = new List<AdminAuditLogItemDto>();

        events.AddRange(await LoadPaymentEventsAsync(limit, cancellationToken));
        events.AddRange(await LoadExamEventsAsync(limit, cancellationToken));
        events.AddRange(await LoadReportEventsAsync(limit, cancellationToken));
        events.AddRange(await LoadUserRegistrationEventsAsync(limit, cancellationToken));

        var ordered = events
            .OrderByDescending(e => e.CreatedAt)
            .ToList();

        var stats = new AdminActivityStatsDto
        {
            All = ordered.Count,
            Exam = ordered.Count(e => e.Type == "exam"),
            Report = ordered.Count(e => e.Type == "report"),
            Payment = ordered.Count(e => e.Type == "payment"),
            User = ordered.Count(e => e.Type == "user"),
        };

        return new AdminActivitySnapshotDto
        {
            Events = ordered,
            Stats = stats,
        };
    }

    private async Task<IReadOnlyList<AdminAuditLogItemDto>> LoadPaymentEventsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var logs = await _context.PaymentAuditLogs
            .AsNoTracking()
            .OrderByDescending(l => l.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        if (logs.Count == 0)
        {
            return [];
        }

        var actorIds = logs
            .Where(l => l.ActorId.HasValue)
            .Select(l => l.ActorId!.Value)
            .Distinct()
            .ToList();

        var actorMap = actorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _context.Users
                .AsNoTracking()
                .Where(u => actorIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UserName ?? u.Email ?? "hệ thống", cancellationToken);

        return logs.Select(log =>
        {
            actorMap.TryGetValue(log.ActorId ?? Guid.Empty, out var actorLabel);
            var detail = PaymentAuditLogFormatter.FormatDetail(log.Action, log.PayloadJson);
            var actor = actorLabel ?? "hệ thống";

            return new AdminAuditLogItemDto
            {
                Id = log.Id,
                Type = "payment",
                Action = log.Action,
                Detail = detail,
                Text = $"{log.Action} — {actor}: {detail}",
                CreatedAt = log.CreatedAt,
            };
        }).ToList();
    }

    private async Task<IReadOnlyList<AdminAuditLogItemDto>> LoadExamEventsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var exams = await _context.Exams
            .AsNoTracking()
            .Include(e => e.Subject)
            .Where(e =>
                e.Status == ExamStatus.PendingApproval
                || e.Status == ExamStatus.Published
                || e.Status == ExamStatus.Rejected)
            .OrderByDescending(e => e.UpdatedAt ?? e.RejectedAt ?? e.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var submitterIds = exams
            .Where(e => e.SubmittedById.HasValue)
            .Select(e => e.SubmittedById!.Value)
            .Distinct()
            .ToList();

        var submitterMap = submitterIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _context.Users
                .AsNoTracking()
                .Where(u => submitterIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UserName ?? u.Email ?? "mod", cancellationToken);

        return exams.Select(exam =>
        {
            var paper = string.IsNullOrWhiteSpace(exam.Title) ? exam.Code : exam.Title;
            var subjectCode = exam.Subject?.Code ?? exam.Code;
            var label = string.IsNullOrWhiteSpace(paper) ? subjectCode : paper;
            submitterMap.TryGetValue(exam.SubmittedById ?? Guid.Empty, out var submitter);

            return exam.Status switch
            {
                ExamStatus.PendingApproval => new AdminAuditLogItemDto
                {
                    Id = exam.Id,
                    Type = "exam",
                    Action = "EXAM_SUBMITTED",
                    Detail = $"Mod gửi đề {label} — chờ duyệt",
                    Text = $"EXAM_SUBMITTED — {submitter ?? "mod"}: Mod gửi đề {label} — chờ duyệt",
                    CreatedAt = exam.UpdatedAt ?? exam.CreatedAt,
                },
                ExamStatus.Rejected => new AdminAuditLogItemDto
                {
                    Id = exam.Id,
                    Type = "exam",
                    Action = "EXAM_REJECTED",
                    Detail = BuildExamRejectionDetail(label, exam.RejectionReasonDetail),
                    Text = $"EXAM_REJECTED — admin: {BuildExamRejectionDetail(label, exam.RejectionReasonDetail)}",
                    CreatedAt = exam.RejectedAt ?? exam.UpdatedAt ?? exam.CreatedAt,
                },
                _ => new AdminAuditLogItemDto
                {
                    Id = exam.Id,
                    Type = "exam",
                    Action = "EXAM_PUBLISHED",
                    Detail = $"Phê duyệt đề {label} — public",
                    Text = $"EXAM_PUBLISHED — admin: Phê duyệt đề {label} — public",
                    CreatedAt = exam.UpdatedAt ?? exam.CreatedAt,
                },
            };
        }).ToList();
    }

    private async Task<IReadOnlyList<AdminAuditLogItemDto>> LoadReportEventsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var perSourceLimit = Math.Max(limit / 5, 20);
        var events = new List<AdminAuditLogItemDto>();

        var postReports = await _context.PostReports
            .AsNoTracking()
            .Where(r => r.Status != ReportStatus.Pending)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(perSourceLimit)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.PostId,
                At = r.UpdatedAt ?? r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        events.AddRange(postReports.Select(r => MapReportEvent(
            r.Id,
            "REPORT_RESOLVED",
            $"Báo cáo đã xử lý — bài viết #{ShortId(r.PostId)} — {FormatReportStatus(r.Status)}",
            r.At)));

        var commentReports = await _context.CommentReports
            .AsNoTracking()
            .Where(r => r.Status != ReportStatus.Pending)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(perSourceLimit)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.CommentId,
                At = r.UpdatedAt ?? r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        events.AddRange(commentReports.Select(r => MapReportEvent(
            r.Id,
            "REPORT_RESOLVED",
            $"Báo cáo đã xử lý — bình luận #{ShortId(r.CommentId)} — {FormatReportStatus(r.Status)}",
            r.At)));

        var userReports = await _context.UserReports
            .AsNoTracking()
            .Where(r => r.Status != ReportStatus.Pending)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(perSourceLimit)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.ReportedUserId,
                At = r.UpdatedAt ?? r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        events.AddRange(userReports.Select(r => MapReportEvent(
            r.Id,
            "REPORT_RESOLVED",
            $"Báo cáo đã xử lý — tài khoản #{ShortId(r.ReportedUserId)} — {FormatReportStatus(r.Status)}",
            r.At)));

        var conversationReports = await _context.ConversationReports
            .AsNoTracking()
            .Where(r => r.Status != ReportStatus.Pending)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(perSourceLimit)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.ConversationId,
                At = r.UpdatedAt ?? r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        events.AddRange(conversationReports.Select(r => MapReportEvent(
            r.Id,
            "REPORT_RESOLVED",
            $"Báo cáo đã xử lý — hội thoại #{ShortId(r.ConversationId)} — {FormatReportStatus(r.Status)}",
            r.At)));

        var questionReports = await _context.QuestionReports
            .AsNoTracking()
            .Where(r => r.Status != ReportStatus.Pending)
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(perSourceLimit)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.QuestionId,
                At = r.UpdatedAt ?? r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        events.AddRange(questionReports.Select(r => MapReportEvent(
            r.Id,
            "REPORT_RESOLVED",
            $"Báo cáo đã xử lý — câu hỏi #{ShortId(r.QuestionId)} — {FormatReportStatus(r.Status)}",
            r.At)));

        return events;
    }

    private async Task<IReadOnlyList<AdminAuditLogItemDto>> LoadUserRegistrationEventsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var rows = await _context.UserProfiles
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Join(
                _context.Users.AsNoTracking(),
                profile => profile.UserId,
                user => user.Id,
                (profile, user) => new
                {
                    profile.Id,
                    profile.CreatedAt,
                    Username = user.UserName ?? user.Email ?? "user",
                })
            .ToListAsync(cancellationToken);

        return rows.Select(row => new AdminAuditLogItemDto
        {
            Id = row.Id,
            Type = "user",
            Action = "USER_REGISTERED",
            Detail = $"Đăng ký mới — {row.Username}",
            Text = $"USER_REGISTERED — {row.Username}: Đăng ký tài khoản mới",
            CreatedAt = row.CreatedAt,
        }).ToList();
    }

    private static AdminAuditLogItemDto MapReportEvent(
        Guid id,
        string action,
        string detail,
        DateTime createdAt) =>
        new()
        {
            Id = id,
            Type = "report",
            Action = action,
            Detail = detail,
            Text = $"{action} — mod: {detail}",
            CreatedAt = createdAt,
        };

    private static string BuildExamRejectionDetail(string label, string? reasonDetail)
    {
        var reason = string.IsNullOrWhiteSpace(reasonDetail) ? "cần chỉnh sửa" : reasonDetail.Trim();
        return $"Từ chối đề {label} — {reason}";
    }

    private static string FormatReportStatus(ReportStatus status) =>
        status switch
        {
            ReportStatus.Approved => "chấp nhận",
            ReportStatus.Rejected => "từ chối",
            ReportStatus.Resolved => "đã xử lý",
            _ => status.ToString().ToLowerInvariant(),
        };

    private static string ShortId(Guid id) => id.ToString()[..8];
}
