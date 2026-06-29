using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.Notifications;

public interface IWorkflowNotificationService
{
    Task NotifyPostLikedAsync(
        Post post,
        Guid likerUserId,
        CancellationToken cancellationToken = default);

    Task NotifyPostCommentedAsync(
        Post post,
        Comment comment,
        Guid commenterUserId,
        Guid? parentCommentAuthorId,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsExamPendingReviewAsync(
        Exam exam,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorExamReviewResultAsync(
        Exam exam,
        bool approved,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsPostReportedAsync(
        Guid reportId,
        Guid postId,
        Guid reporterUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsCommentReportedAsync(
        Guid reportId,
        Guid postId,
        Guid commentId,
        Guid reporterUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsUserReportedAsync(
        Guid reportId,
        Guid reportedUserId,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsConversationReportedAsync(
        Guid reportId,
        Guid conversationId,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsQuestionReportedAsync(
        Guid reportId,
        Question question,
        Exam exam,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsRefundRequestedAsync(
        PaymentOrder order,
        Guid studentUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsRefundBankDetailsSubmittedAsync(
        PaymentOrder order,
        Guid studentUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserRefundCompletedAsync(
        PaymentOrder order,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyStudentPracticeReviewedAsync(
        PracticeSubmission submission,
        Exam exam,
        PracticeSubmissionStatus status,
        string? reviewerComment,
        Guid? reviewerUserId,
        CancellationToken cancellationToken = default);

    Task NotifyMentionedInCommentAsync(
        Post post,
        Comment comment,
        IReadOnlyList<Guid> mentionedUserIds,
        Guid commenterUserId,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsPostPendingAsync(
        Post post,
        Guid authorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyModeratorsPracticeSubmittedAsync(
        PracticeSubmission submission,
        Exam exam,
        Guid studentUserId,
        CancellationToken cancellationToken = default);

    Task NotifyPostAuthorModerationResultAsync(
        Post post,
        bool approved,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserWarnedAsync(
        Guid userId,
        string reason,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserBannedAsync(
        Guid userId,
        int durationDays,
        DateTime banUntil,
        string reason,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserUnbannedAsync(
        Guid userId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsPaymentWaitingConfirmationAsync(
        PaymentOrder order,
        Guid studentUserId,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsFeedbackSubmittedAsync(
        Guid feedbackId,
        Guid submitterUserId,
        string username,
        string description,
        CancellationToken cancellationToken = default);
}

public sealed class WorkflowNotificationService : IWorkflowNotificationService
{
    private readonly INotificationService _notificationService;
    private readonly IUserRepository _userRepository;
    private readonly IUserSearchRepository _searchRepository;

    public WorkflowNotificationService(
        INotificationService notificationService,
        IUserRepository userRepository,
        IUserSearchRepository searchRepository)
    {
        _notificationService = notificationService;
        _userRepository = userRepository;
        _searchRepository = searchRepository;
    }

    public async Task NotifyPostLikedAsync(
        Post post,
        Guid likerUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(likerUserId, cancellationToken);
        var postLabel = BuildPostLabel(post);

        await _notificationService.CreateAsync(
            post.AuthorId,
            NotificationType.Like,
            $"{actorName} đã thích bài viết của bạn",
            postLabel,
            $"/home/posts/{post.Id}",
            likerUserId,
            post.Id,
            cancellationToken);
    }

    public async Task NotifyPostCommentedAsync(
        Post post,
        Comment comment,
        Guid commenterUserId,
        Guid? parentCommentAuthorId,
        CancellationToken cancellationToken = default)
    {
        if (post.AuthorId == commenterUserId)
        {
            return;
        }

        var actorName = await ResolveActorNameAsync(commenterUserId, cancellationToken);
        var preview = Truncate(StripHtml(comment.Content), 120);
        var linkUrl = $"/home/posts/{post.Id}";

        await _notificationService.CreateAsync(
            post.AuthorId,
            NotificationType.Comment,
            $"{actorName} đã bình luận bài viết của bạn",
            preview,
            linkUrl,
            commenterUserId,
            comment.Id,
            cancellationToken);
    }

    public async Task NotifyMentionedInCommentAsync(
        Post post,
        Comment comment,
        IReadOnlyList<Guid> mentionedUserIds,
        Guid commenterUserId,
        CancellationToken cancellationToken = default)
    {
        if (mentionedUserIds.Count == 0)
        {
            return;
        }

        var actorName = await ResolveActorNameAsync(commenterUserId, cancellationToken);
        var preview = Truncate(StripHtml(comment.Content), 120);
        var linkUrl = $"/home/posts/{post.Id}";

        foreach (var mentionedUserId in mentionedUserIds.Distinct())
        {
            if (mentionedUserId == commenterUserId)
            {
                continue;
            }

            await _notificationService.CreateAsync(
                mentionedUserId,
                NotificationType.Mention,
                $"{actorName} đã nhắc đến bạn trong bình luận",
                preview,
                linkUrl,
                commenterUserId,
                comment.Id,
                cancellationToken);
        }
    }

    public async Task NotifyAdminsExamPendingReviewAsync(
        Exam exam,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = actorUserId.HasValue
            ? await ResolveActorNameAsync(actorUserId.Value, cancellationToken)
            : "Moderator";

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.ExamReview,
            $"{actorName} gửi đề chờ duyệt",
            $"{exam.Code} — {exam.Title}",
            $"/admin/exams/{exam.Id}",
            actorUserId,
            exam.Id,
            cancellationToken);
    }

    public async Task NotifyModeratorExamReviewResultAsync(
        Exam exam,
        bool approved,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        if (exam.SubmittedById is not Guid moderatorId)
        {
            return;
        }

        var title = approved
            ? $"Đề {exam.Code} đã được Admin duyệt"
            : $"Đề {exam.Code} bị Admin từ chối";

        var body = approved
            ? exam.Title
            : exam.RejectionReasonDetail ?? "Vui lòng xem chi tiết và chỉnh sửa.";

        await _notificationService.CreateAsync(
            moderatorId,
            NotificationType.ExamReview,
            title,
            body,
            "/moderator/exams/history",
            actorUserId,
            exam.Id,
            cancellationToken);
    }

    public async Task NotifyModeratorsPostReportedAsync(
        Guid reportId,
        Guid postId,
        Guid reporterUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(reporterUserId, cancellationToken);
        var reasonLabel = FormatReportReason(reason);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bài viết",
            $"Lý do: {reasonLabel}",
            "/moderator/reports",
            reporterUserId,
            reportId,
            cancellationToken);
    }

    public async Task NotifyModeratorsCommentReportedAsync(
        Guid reportId,
        Guid postId,
        Guid commentId,
        Guid reporterUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(reporterUserId, cancellationToken);
        var reasonLabel = FormatReportReason(reason);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bình luận",
            $"Lý do: {reasonLabel}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);
    }

    public async Task NotifyModeratorsUserReportedAsync(
        Guid reportId,
        Guid reportedUserId,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(reporterUserId, cancellationToken);
        var reportedUser = await _userRepository.GetByIdAsync(reportedUserId, cancellationToken);
        var reportedLabel = reportedUser?.Username ?? "tài khoản";
        var reasonLabel = FormatReportReason(reason);
        var preview = Truncate(detail, 120);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo người dùng @{reportedLabel}",
            $"Lý do: {reasonLabel} — {preview}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);
    }

    public async Task NotifyModeratorsConversationReportedAsync(
        Guid reportId,
        Guid conversationId,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(reporterUserId, cancellationToken);
        var reasonLabel = FormatReportReason(reason);
        var preview = Truncate(detail, 120);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo cuộc trò chuyện",
            $"Lý do: {reasonLabel} — {preview}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);
    }

    public async Task NotifyModeratorsQuestionReportedAsync(
        Guid reportId,
        Question question,
        Exam exam,
        Guid reporterUserId,
        string reason,
        string detail,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(reporterUserId, cancellationToken);
        var reasonLabel = FormatReportReason(reason);
        var preview = Truncate(detail, 120);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo câu hỏi đề {exam.Code}",
            $"Lý do: {reasonLabel} — {preview}",
            "/moderator/reports",
            reporterUserId,
            reportId,
            cancellationToken);
    }

    public async Task NotifyAdminsRefundRequestedAsync(
        PaymentOrder order,
        Guid studentUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(studentUserId, cancellationToken);
        var amount = $"{order.Amount:N0}đ".Replace(",", ".", StringComparison.Ordinal);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} yêu cầu hoàn tiền",
            $"Mã đơn {order.PayOsOrderCode} — {amount} — {Truncate(reason, 80)}",
            "/admin/payments",
            studentUserId,
            order.Id,
            cancellationToken);
    }

    public async Task NotifyAdminsRefundBankDetailsSubmittedAsync(
        PaymentOrder order,
        Guid studentUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(studentUserId, cancellationToken);
        var amount = $"{order.Amount:N0}đ".Replace(",", ".", StringComparison.Ordinal);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} đã gửi thông tin nhận hoàn tiền",
            $"Mã đơn {order.PayOsOrderCode} — {amount} — cần chuyển khoản hoàn tiền",
            "/admin/payments",
            studentUserId,
            order.Id,
            cancellationToken);
    }

    public async Task NotifyUserRefundCompletedAsync(
        PaymentOrder order,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var amount = $"{order.Amount:N0}đ".Replace(",", ".", StringComparison.Ordinal);

        await _notificationService.CreateAsync(
            order.UserId,
            NotificationType.Refund,
            "Hoàn tiền thành công",
            $"SEHub đã hoàn {amount} cho đơn {order.PayOsOrderCode}. Cảm ơn bạn đã sử dụng dịch vụ.",
            "/home/premium",
            actorUserId,
            order.Id,
            cancellationToken);
    }

    public async Task NotifyStudentPracticeReviewedAsync(
        PracticeSubmission submission,
        Exam exam,
        PracticeSubmissionStatus status,
        string? reviewerComment,
        Guid? reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        var statusLabel = status switch
        {
            PracticeSubmissionStatus.Passed => "Đạt",
            PracticeSubmissionStatus.Failed => "Chưa đạt",
            _ => "Đã chấm",
        };

        var body = !string.IsNullOrWhiteSpace(reviewerComment)
            ? Truncate(reviewerComment, 160)
            : $"{exam.Code} — {exam.Title}";

        await _notificationService.CreateAsync(
            submission.UserId,
            NotificationType.PracticeResult,
            $"Kết quả thực hành: {statusLabel}",
            body,
            $"/exams/{exam.Id}/practice",
            reviewerUserId,
            submission.Id,
            cancellationToken);
    }

    public async Task NotifyModeratorsPostPendingAsync(
        Post post,
        Guid authorUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(authorUserId, cancellationToken);
        var postLabel = BuildPostLabel(post);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} đăng bài chờ duyệt",
            postLabel,
            "/moderator/content",
            authorUserId,
            post.Id,
            cancellationToken);
    }

    public async Task NotifyModeratorsPracticeSubmittedAsync(
        PracticeSubmission submission,
        Exam exam,
        Guid studentUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(studentUserId, cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator, RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} nộp bài thực hành",
            $"{exam.Code} — {exam.Title}",
            "/admin/exams/submissions",
            studentUserId,
            submission.Id,
            cancellationToken);
    }

    public async Task NotifyPostAuthorModerationResultAsync(
        Post post,
        bool approved,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var title = approved
            ? "Bài viết của bạn đã được duyệt"
            : "Bài viết của bạn bị từ chối";

        var body = approved
            ? BuildPostLabel(post)
            : post.ModerationNote ?? "Vui lòng chỉnh sửa và gửi lại.";

        await _notificationService.CreateAsync(
            post.AuthorId,
            NotificationType.Moderation,
            title,
            body,
            $"/home/posts/{post.Id}",
            actorUserId,
            post.Id,
            cancellationToken);
    }

    public async Task NotifyUserWarnedAsync(
        Guid userId,
        string reason,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var body = Truncate(reason, 160);
        if (string.IsNullOrWhiteSpace(body))
        {
            body = "Vui lòng tuân thủ quy định cộng đồng SEHub.";
        }

        await _notificationService.CreateAsync(
            userId,
            NotificationType.Moderation,
            "Bạn nhận cảnh cáo từ kiểm duyệt viên",
            body,
            "/home",
            actorUserId,
            userId,
            cancellationToken);
    }

    public async Task NotifyUserBannedAsync(
        Guid userId,
        int durationDays,
        DateTime banUntil,
        string reason,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var untilLabel = banUntil.ToString("dd/MM/yyyy HH:mm", System.Globalization.CultureInfo.InvariantCulture);
        var reasonLabel = Truncate(reason, 120);
        var body = string.IsNullOrWhiteSpace(reasonLabel)
            ? $"Khóa {durationDays} ngày, đến {untilLabel} (UTC)."
            : $"Khóa {durationDays} ngày, đến {untilLabel} (UTC). Lý do: {reasonLabel}";

        await _notificationService.CreateAsync(
            userId,
            NotificationType.Moderation,
            "Tài khoản của bạn bị khóa tạm thời",
            body,
            "/support",
            actorUserId,
            userId,
            cancellationToken);
    }

    public async Task NotifyUserUnbannedAsync(
        Guid userId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        await _notificationService.CreateAsync(
            userId,
            NotificationType.Moderation,
            "Tài khoản của bạn đã được mở khóa",
            "Bạn có thể tiếp tục sử dụng SEHub. Hãy tuân thủ quy định cộng đồng.",
            "/home",
            actorUserId,
            userId,
            cancellationToken);
    }

    public async Task NotifyAdminsPaymentWaitingConfirmationAsync(
        PaymentOrder order,
        Guid studentUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(studentUserId, cancellationToken);
        var amount = $"{order.Amount:N0}đ".Replace(",", ".", StringComparison.Ordinal);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} chờ xác nhận thanh toán Premium",
            $"Mã đơn {order.PayOsOrderCode} — {amount}",
            "/admin/payments",
            studentUserId,
            order.Id,
            cancellationToken);
    }

    public async Task NotifyAdminsFeedbackSubmittedAsync(
        Guid feedbackId,
        Guid submitterUserId,
        string username,
        string description,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(submitterUserId, cancellationToken);
        var preview = Truncate(description, 120);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} gửi phản hồi / báo lỗi",
            $"@{username}: {preview}",
            "/admin/feedback",
            submitterUserId,
            feedbackId,
            cancellationToken);
    }

    private async Task NotifyRoleMembersAsync(
        IReadOnlyList<string> roles,
        NotificationType type,
        string title,
        string? body,
        string? linkUrl,
        Guid? actorUserId,
        Guid? referenceId,
        CancellationToken cancellationToken)
    {
        var userIds = await _userRepository.GetUserIdsByRolesAsync(roles, cancellationToken);
        foreach (var userId in userIds)
        {
            await _notificationService.CreateAsync(
                userId,
                type,
                title,
                body,
                linkUrl,
                actorUserId,
                referenceId,
                cancellationToken);
        }
    }

    private async Task<string> ResolveActorNameAsync(Guid actorUserId, CancellationToken cancellationToken)
    {
        var rows = await _searchRepository.GetByIdsAsync([actorUserId], cancellationToken);
        var actor = rows.FirstOrDefault();
        return actor?.FullName ?? actor?.Username ?? "Ai đó";
    }

    private static string BuildPostLabel(Post post)
    {
        if (!string.IsNullOrWhiteSpace(post.Title))
        {
            return Truncate(post.Title, 120);
        }

        return Truncate(post.Content, 120);
    }

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : $"{trimmed[..maxLength]}…";
    }

    private static string StripHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return System.Text.RegularExpressions.Regex.Replace(value, "<[^>]+>", " ").Trim();
    }

    private static string FormatReportReason(string reason) =>
        reason.Replace("_", " ", StringComparison.Ordinal);
}
