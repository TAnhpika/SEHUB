using System.Text;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminExportService
{
    Task<(byte[] Content, string FileName)> ExportDashboardCsvAsync(CancellationToken cancellationToken = default);
    Task<(byte[] Content, string FileName)> ExportUsersCsvAsync(CancellationToken cancellationToken = default);
    Task<(byte[] Content, string FileName)> ExportPaymentsCsvAsync(CancellationToken cancellationToken = default);
    Task<(byte[] Content, string FileName)> ExportReportsCsvAsync(CancellationToken cancellationToken = default);
    Task<(byte[] Content, string FileName)> ExportViolationsCsvAsync(CancellationToken cancellationToken = default);
}

public sealed class AdminExportService : IAdminExportService
{
    private readonly IAdminDashboardService _dashboardService;
    private readonly IUserRepository _userRepository;
    private readonly IPaymentOrderRepository _paymentOrderRepository;
    private readonly IPostReportRepository _reportRepository;
    private readonly IModerationService _moderationService;

    public AdminExportService(
        IAdminDashboardService dashboardService,
        IUserRepository userRepository,
        IPaymentOrderRepository paymentOrderRepository,
        IPostReportRepository reportRepository,
        IModerationService moderationService)
    {
        _dashboardService = dashboardService;
        _userRepository = userRepository;
        _paymentOrderRepository = paymentOrderRepository;
        _reportRepository = reportRepository;
        _moderationService = moderationService;
    }

    public async Task<(byte[] Content, string FileName)> ExportDashboardCsvAsync(CancellationToken cancellationToken = default)
    {
        var stats = await _dashboardService.GetStatsAsync(cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("metric,value");
        sb.AppendLine($"total_users,{stats.TotalUsers}");
        sb.AppendLine($"total_posts,{stats.TotalPosts}");
        sb.AppendLine($"total_exams,{stats.TotalExams}");
        sb.AppendLine($"pending_reports,{stats.PendingReports}");
        sb.AppendLine($"total_revenue,{stats.TotalRevenue}");
        sb.AppendLine($"active_subscriptions,{stats.ActiveSubscriptions}");
        sb.AppendLine($"total_documents,{stats.TotalDocuments}");
        return (Encoding.UTF8.GetBytes(sb.ToString()), $"dashboard-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    public async Task<(byte[] Content, string FileName)> ExportUsersCsvAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetPagedAsync(1, 5000, null, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("id,username,email,display_name,points,level,streak,is_banned");
        foreach (var user in users)
        {
            sb.AppendLine(string.Join(',',
                Csv(user.Id.ToString()),
                Csv(user.Username),
                Csv(user.Email),
                Csv(user.DisplayName),
                user.Points.ToString(),
                Csv(user.LevelName ?? string.Empty),
                user.StreakCount.ToString(),
                user.IsBanned ? "true" : "false"));
        }

        return (Encoding.UTF8.GetBytes(sb.ToString()), $"users-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    public async Task<(byte[] Content, string FileName)> ExportPaymentsCsvAsync(CancellationToken cancellationToken = default)
    {
        var orders = await _paymentOrderRepository.GetPagedAsync(1, 5000, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("order_id,payos_code,amount,original_amount,discount_percent,status,created_at");
        foreach (var order in orders.Items)
        {
            sb.AppendLine(string.Join(',',
                Csv(order.Id.ToString()),
                Csv(order.PayOsOrderCode),
                order.Amount.ToString("0"),
                order.OriginalAmount.ToString("0"),
                order.DiscountPercent?.ToString() ?? string.Empty,
                Csv(order.Status.ToString()),
                Csv(order.CreatedAt.ToString("O"))));
        }

        return (Encoding.UTF8.GetBytes(sb.ToString()), $"payments-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    public async Task<(byte[] Content, string FileName)> ExportReportsCsvAsync(CancellationToken cancellationToken = default)
    {
        var (items, _) = await _reportRepository.GetPagedAsync(
            1,
            5000,
            null,
            nonPendingOnly: false,
            cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("report_id,post_id,reporter_id,reason,status,created_at");
        foreach (var report in items)
        {
            sb.AppendLine(string.Join(',',
                Csv(report.Id.ToString()),
                Csv(report.PostId.ToString()),
                Csv(report.ReporterId.ToString()),
                Csv(report.Reason),
                Csv(report.Status.ToString()),
                Csv(report.CreatedAt.ToString("O"))));
        }

        return (Encoding.UTF8.GetBytes(sb.ToString()), $"reports-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    public async Task<(byte[] Content, string FileName)> ExportViolationsCsvAsync(CancellationToken cancellationToken = default)
    {
        var result = await _moderationService.GetViolatingUsersAsync(
            new ViolationsQueryParams { Page = 1, PageSize = 5000 },
            cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("user_id,username,email,display_name,violations,warnings,status,ban_type,ban_until,last_action_at");
        foreach (var user in result.Items)
        {
            sb.AppendLine(string.Join(',',
                Csv(user.Id.ToString()),
                Csv(user.Username),
                Csv(user.Email),
                Csv(user.DisplayName),
                user.ViolationCount.ToString(),
                user.WarningCount.ToString(),
                Csv(user.Status),
                Csv(user.BanType ?? string.Empty),
                Csv(user.BanUntil?.ToString("O") ?? string.Empty),
                Csv(user.LastActionAt?.ToString("O") ?? string.Empty)));
        }

        return (Encoding.UTF8.GetBytes(sb.ToString()), $"violations-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string Csv(string? value)
    {
        var text = value ?? string.Empty;
        if (text.Contains('"') || text.Contains(',') || text.Contains('\n'))
        {
            return $"\"{text.Replace("\"", "\"\"")}\"";
        }

        return text;
    }
}
