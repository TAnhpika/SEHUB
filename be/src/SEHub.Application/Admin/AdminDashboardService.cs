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
    private readonly IPaymentOrderRepository _paymentOrderRepository;

    public AdminDashboardService(
        IUserRepository userRepository,
        IPostRepository postRepository,
        IExamRepository examRepository,
        IPostReportRepository reportRepository,
        IPaymentOrderRepository paymentOrderRepository)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _examRepository = examRepository;
        _reportRepository = reportRepository;
        _paymentOrderRepository = paymentOrderRepository;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var (_, pendingReports) = await _reportRepository.GetPagedAsync(1, 1, ReportStatus.Pending, cancellationToken);

        return new DashboardStatsDto
        {
            TotalUsers = await _userRepository.CountAsync(null, cancellationToken),
            TotalPosts = (await _postRepository.GetPagedAsync(new Contracts.Feed.PostQueryParams { Page = 1, PageSize = 1 }, cancellationToken)).TotalCount,
            TotalExams = await _examRepository.CountPublishedAsync(cancellationToken),
            PendingReports = pendingReports,
            TotalRevenue = await _paymentOrderRepository.GetTotalRevenueAsync(cancellationToken)
        };
    }
}
