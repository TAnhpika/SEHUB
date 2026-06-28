using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Domain.Enums;

namespace SEHub.Application.Admin;

public sealed class AdminDashboardService : IAdminDashboardService
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly IExamRepository _examRepository;
    private readonly IPostReportRepository _reportRepository;
    private readonly ICommentReportRepository _commentReportRepository;
    private readonly IUserReportRepository _userReportRepository;
    private readonly IConversationReportRepository _conversationReportRepository;
    private readonly IQuestionReportRepository _questionReportRepository;
    private readonly IPaymentOrderRepository _paymentOrderRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IDocumentRepository _documentRepository;

    public AdminDashboardService(
        IUserRepository userRepository,
        IPostRepository postRepository,
        IExamRepository examRepository,
        IPostReportRepository reportRepository,
        ICommentReportRepository commentReportRepository,
        IUserReportRepository userReportRepository,
        IConversationReportRepository conversationReportRepository,
        IQuestionReportRepository questionReportRepository,
        IPaymentOrderRepository paymentOrderRepository,
        ISubscriptionRepository subscriptionRepository,
        IDocumentRepository documentRepository)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _examRepository = examRepository;
        _reportRepository = reportRepository;
        _commentReportRepository = commentReportRepository;
        _userReportRepository = userReportRepository;
        _conversationReportRepository = conversationReportRepository;
        _questionReportRepository = questionReportRepository;
        _paymentOrderRepository = paymentOrderRepository;
        _subscriptionRepository = subscriptionRepository;
        _documentRepository = documentRepository;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var pendingPostReports = await _reportRepository.CountAsync(ReportStatus.Pending, cancellationToken: cancellationToken);
        var pendingCommentReports = await _commentReportRepository.CountAsync(ReportStatus.Pending, cancellationToken: cancellationToken);
        var pendingUserReports = await _userReportRepository.CountPendingAsync(cancellationToken);
        var pendingConversationReports = await _conversationReportRepository.CountPendingAsync(cancellationToken);
        var pendingQuestionReports = await _questionReportRepository.CountPendingAsync(cancellationToken);
        var pendingReports = pendingPostReports
            + pendingCommentReports
            + pendingUserReports
            + pendingConversationReports
            + pendingQuestionReports;

        return new DashboardStatsDto
        {
            TotalUsers = await _userRepository.CountAsync(null, cancellationToken),
            TotalPosts = (await _postRepository.GetPagedAsync(new Contracts.Feed.PostQueryParams { Page = 1, PageSize = 1 }, cancellationToken)).TotalCount,
            TotalExams = await _examRepository.CountPublishedAsync(cancellationToken),
            PendingReports = pendingReports,
            TotalRevenue = await _paymentOrderRepository.GetTotalRevenueAsync(cancellationToken),
            ActiveSubscriptions = await _subscriptionRepository.CountActiveAsync(cancellationToken),
            TotalDocuments = await _documentRepository.CountAsync(cancellationToken)
        };
    }
}
