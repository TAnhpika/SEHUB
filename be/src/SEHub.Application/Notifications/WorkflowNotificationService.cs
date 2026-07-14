using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;
using SEHub.Shared.Subjects;

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
        bool isResubmit,
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

    Task NotifyAdminsPracticeReviewedByModeratorAsync(
        PracticeSubmission submission,
        Exam exam,
        PracticeSubmissionStatus status,
        string? reviewerComment,
        Guid moderatorUserId,
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
        Guid penaltyId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserBannedAsync(
        Guid userId,
        int durationDays,
        DateTime banUntil,
        string reason,
        Guid penaltyId,
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

    Task NotifyUserFeedbackResolvedAsync(
        Guid userId,
        Guid feedbackId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyUserFeedbackRejectedAsync(
        Guid userId,
        Guid feedbackId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsPartnerVoucherPoolEmptyAsync(
        string typeCode,
        string planCode,
        Guid paymentOrderId,
        CancellationToken cancellationToken = default);

    Task NotifyAdminsPartnerVoucherAssignedAsync(
        string typeLabel,
        string voucherCode,
        string recipientUsername,
        Guid? paymentOrderId,
        Guid voucherCodeId,
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
        bool isResubmit,
        CancellationToken cancellationToken = default)
    {
        var actorName = actorUserId.HasValue
            ? await ResolveActorNameAsync(actorUserId.Value, cancellationToken)
            : "Moderator";

        var title = isResubmit
            ? $"{actorName} gửi lại đề đã sửa — cần duyệt"
            : $"{actorName} gửi đề chờ duyệt";

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.ExamReview,
            title,
            $"{exam.PaperCode} ({exam.SubjectCode})",
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
            ? $"Đề {exam.PaperCode} đã được Admin duyệt"
            : $"Đề {exam.PaperCode} bị Admin từ chối";

        var body = approved
            ? exam.PaperCode
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bài viết",
            $"Lý do: {reasonLabel}",
            "/moderator/reports",
            reporterUserId,
            reportId,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bài viết",
            $"Lý do: {reasonLabel}",
            "/admin/moderation",
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bình luận",
            $"Lý do: {reasonLabel}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo một bình luận",
            $"Lý do: {reasonLabel}",
            "/admin/moderation",
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} báo cáo người dùng @{reportedLabel}",
            $"Lý do: {reasonLabel} — {preview}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo người dùng @{reportedLabel}",
            $"Lý do: {reasonLabel} — {preview}",
            "/admin/moderation",
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} báo cáo cuộc trò chuyện",
            $"Lý do: {reasonLabel} — {preview}",
            $"/moderator/reports?id={reportId}",
            reporterUserId,
            reportId,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo cuộc trò chuyện",
            $"Lý do: {reasonLabel} — {preview}",
            "/admin/moderation",
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} báo cáo câu hỏi đề {exam.PaperCode}",
            $"Lý do: {reasonLabel} — {preview}",
            "/moderator/reports",
            reporterUserId,
            reportId,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} báo cáo câu hỏi đề {exam.PaperCode}",
            $"Lý do: {reasonLabel} — {preview}",
            "/admin/moderation",
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
        var statusLabel = BuildPracticeReviewStatusLabel(status);

        var body = !string.IsNullOrWhiteSpace(reviewerComment)
            ? Truncate(reviewerComment, 160)
            : exam.PaperCode;

        await _notificationService.CreateAsync(
            submission.UserId,
            NotificationType.PracticeResult,
            $"Kết quả thực hành: {statusLabel}",
            body,
            ExamFrontendPaths.BuildPracticeExamDetailPath(exam.SubjectCode, exam.PaperCode),
            reviewerUserId,
            submission.Id,
            cancellationToken);
    }

    public async Task NotifyAdminsPracticeReviewedByModeratorAsync(
        PracticeSubmission submission,
        Exam exam,
        PracticeSubmissionStatus status,
        string? reviewerComment,
        Guid moderatorUserId,
        CancellationToken cancellationToken = default)
    {
        var actorName = await ResolveActorNameAsync(moderatorUserId, cancellationToken);
        var student = await _userRepository.GetByIdAsync(submission.UserId, cancellationToken);
        var studentLabel = student?.Username ?? student?.DisplayName ?? "sinh viên";
        var statusLabel = BuildPracticeReviewStatusLabel(status);
        var paper = string.IsNullOrWhiteSpace(exam.PaperCode) ? exam.SubjectCode : exam.PaperCode;
        var body = !string.IsNullOrWhiteSpace(reviewerComment)
            ? $"@{studentLabel} — {paper} ({exam.SubjectCode}): {statusLabel} — {Truncate(reviewerComment, 120)}"
            : $"@{studentLabel} — {paper} ({exam.SubjectCode}): {statusLabel}";

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} đã chấm bài thực hành",
            body,
            $"/admin/moderation/practice-submissions?highlight={submission.Id}",
            moderatorUserId,
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} đăng bài chờ duyệt",
            postLabel,
            "/moderator/content",
            authorUserId,
            post.Id,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} đăng bài chờ duyệt",
            postLabel,
            "/admin/moderation/content",
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
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} nộp bài thực hành",
            $"{exam.PaperCode} ({exam.SubjectCode})",
            "/moderator/practice-submissions",
            studentUserId,
            submission.Id,
            cancellationToken);

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            $"{actorName} nộp bài thực hành",
            $"{exam.PaperCode} ({exam.SubjectCode})",
            $"/admin/moderation/practice-submissions?highlight={submission.Id}",
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
        Guid penaltyId,
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
            penaltyId,
            cancellationToken);
    }

    public async Task NotifyUserBannedAsync(
        Guid userId,
        int durationDays,
        DateTime banUntil,
        string reason,
        Guid penaltyId,
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
            penaltyId,
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

        await NotifyRoleMembersAsync(
            [RoleNames.Moderator],
            NotificationType.Moderation,
            $"{actorName} gửi phản hồi / báo lỗi",
            $"@{username}: {preview}",
            "/moderator/feedback",
            submitterUserId,
            feedbackId,
            cancellationToken);
    }

    public async Task NotifyUserFeedbackResolvedAsync(
        Guid userId,
        Guid feedbackId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        await _notificationService.CreateAsync(
            userId,
            NotificationType.Moderation,
            "Phản hồi của bạn đã được xử lý",
            "Cảm ơn bạn đã góp ý. Bạn nhận +50 điểm vì phản hồi hữu ích.",
            "/home/feedback",
            actorUserId,
            feedbackId,
            cancellationToken);
    }

    public async Task NotifyUserFeedbackRejectedAsync(
        Guid userId,
        Guid feedbackId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        await _notificationService.CreateAsync(
            userId,
            NotificationType.Moderation,
            "Phản hồi của bạn bị từ chối",
            "Báo cáo / phản hồi được đánh giá là không đúng hoặc không đủ cơ sở để xử lý.",
            "/home/feedback",
            actorUserId,
            feedbackId,
            cancellationToken);
    }

    public async Task NotifyAdminsPartnerVoucherPoolEmptyAsync(
        string typeCode,
        string planCode,
        Guid paymentOrderId,
        CancellationToken cancellationToken = default)
    {
        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            "Kho mã FTES đã hết",
            $"Đơn Premium ({planCode}) cần {typeCode} nhưng kho trống. Hãy import thêm mã.",
            "/admin/vouchers",
            null,
            paymentOrderId,
            cancellationToken);
    }

    public async Task NotifyAdminsPartnerVoucherAssignedAsync(
        string typeLabel,
        string voucherCode,
        string recipientUsername,
        Guid? paymentOrderId,
        Guid voucherCodeId,
        CancellationToken cancellationToken = default)
    {
        var orderHint = paymentOrderId.HasValue
            ? $" (đơn {paymentOrderId.Value:N})"
            : string.Empty;

        await NotifyRoleMembersAsync(
            [RoleNames.Admin],
            NotificationType.Moderation,
            "Voucher FTES đã được cấp",
            $"{typeLabel} → @{recipientUsername}: {voucherCode}{orderHint}",
            "/admin/vouchers",
            null,
            voucherCodeId,
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

    private static string BuildPracticeReviewStatusLabel(PracticeSubmissionStatus status) =>
        status switch
        {
            PracticeSubmissionStatus.Passed => "Đạt",
            PracticeSubmissionStatus.Failed => "Chưa đạt",
            _ => "Đã chấm",
        };

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : $"{trimmed[..maxLength]}…";
    }

    private static string StripHtml(string? value) =>
        SEHub.Application.Common.HtmlContentHelper.ToPlainText(value);

    private static string FormatReportReason(string reason) =>
        reason.Replace("_", " ", StringComparison.Ordinal);
}
