using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public sealed class AdminDashboardChartsService : IAdminDashboardChartsService
{
    private readonly IUserProfileRepository _profileRepository;
    private readonly IPaymentOrderRepository _paymentOrderRepository;
    private readonly IUserDailyActivityRepository _activityRepository;

    public AdminDashboardChartsService(
        IUserProfileRepository profileRepository,
        IPaymentOrderRepository paymentOrderRepository,
        IUserDailyActivityRepository activityRepository)
    {
        _profileRepository = profileRepository;
        _paymentOrderRepository = paymentOrderRepository;
        _activityRepository = activityRepository;
    }

    public async Task<AdminDashboardChartsDto> GetChartsAsync(string period, CancellationToken cancellationToken = default)
    {
        var normalized = string.IsNullOrWhiteSpace(period) ? "month" : period.Trim().ToLowerInvariant();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return normalized switch
        {
            "quarter" => await BuildQuarterChartsAsync(today, cancellationToken),
            "year" => await BuildYearChartsAsync(today, cancellationToken),
            _ => await BuildMonthChartsAsync(today, cancellationToken)
        };
    }

    private async Task<AdminDashboardChartsDto> BuildMonthChartsAsync(DateOnly today, CancellationToken cancellationToken)
    {
        var start = today.AddMonths(-5);
        var registrations = await _profileRepository.GetRegistrationCountsByDateRangeAsync(start, today, cancellationToken);
        var revenue = await _paymentOrderRepository.GetPaidRevenueByDateRangeAsync(start, today, cancellationToken);
        var activity = await _activityRepository.GetDailyTotalsAsync(start, today, cancellationToken);

        var monthBuckets = Enumerable.Range(0, 6)
            .Select(i => DateOnly.FromDateTime(new DateTime(today.Year, today.Month, 1).AddMonths(-5 + i)))
            .ToList();

        var userData = monthBuckets.Select((month, index) => new ChartDataPointDto
        {
            Label = $"T{index + 1}",
            Value = registrations.Where(r => r.Date.Year == month.Year && r.Date.Month == month.Month).Sum(r => r.Count)
        }).ToList();

        var revenueData = monthBuckets.Select((month, index) => new ChartDataPointDto
        {
            Label = $"T{index + 1}",
            Value = Math.Round(
                revenue.Where(r => r.Date.Year == month.Year && r.Date.Month == month.Month).Sum(r => r.Amount) / 1_000_000m,
                1)
        }).ToList();

        var activityData = monthBuckets.Select((month, index) => new ChartDataPointDto
        {
            Label = $"T{index + 1}",
            Value = activity.Where(a => a.Date.Year == month.Year && a.Date.Month == month.Month).Sum(a => a.Count)
        }).ToList();

        return new AdminDashboardChartsDto
        {
            Period = "month",
            UserRegistrations = BuildSeries(userData, "Đăng ký mới", "6 tháng gần nhất"),
            Revenue = BuildSeries(revenueData, "Doanh thu (triệu)", "6 tháng gần nhất"),
            Traffic = BuildSeries(activityData, "Phiên hoạt động", "6 tháng gần nhất")
        };
    }

    private async Task<AdminDashboardChartsDto> BuildQuarterChartsAsync(DateOnly today, CancellationToken cancellationToken)
    {
        var start = today.AddDays(-41);
        var registrations = await _profileRepository.GetRegistrationCountsByDateRangeAsync(start, today, cancellationToken);
        var revenue = await _paymentOrderRepository.GetPaidRevenueByDateRangeAsync(start, today, cancellationToken);
        var activity = await _activityRepository.GetDailyTotalsAsync(start, today, cancellationToken);

        var weekStarts = Enumerable.Range(0, 6)
            .Select(i => start.AddDays(i * 7))
            .ToList();

        var userData = weekStarts.Select((weekStart, index) =>
        {
            var weekEnd = weekStart.AddDays(6);
            return new ChartDataPointDto
            {
                Label = $"T{index + 2}",
                Value = registrations.Where(r => r.Date >= weekStart && r.Date <= weekEnd).Sum(r => r.Count)
            };
        }).ToList();

        var revenueData = weekStarts.Select((weekStart, index) =>
        {
            var weekEnd = weekStart.AddDays(6);
            return new ChartDataPointDto
            {
                Label = $"T{index + 2}",
                Value = Math.Round(
                    revenue.Where(r => r.Date >= weekStart && r.Date <= weekEnd).Sum(r => r.Amount) / 1_000_000m,
                    1)
            };
        }).ToList();

        var activityData = weekStarts.Select((weekStart, index) =>
        {
            var weekEnd = weekStart.AddDays(6);
            return new ChartDataPointDto
            {
                Label = $"T{index + 2}",
                Value = activity.Where(a => a.Date >= weekStart && a.Date <= weekEnd).Sum(a => a.Count)
            };
        }).ToList();

        return new AdminDashboardChartsDto
        {
            Period = "quarter",
            UserRegistrations = BuildSeries(userData, "Đăng ký mới", "Theo tuần trong quý"),
            Revenue = BuildSeries(revenueData, "Doanh thu (triệu)", "Theo tuần trong quý"),
            Traffic = BuildSeries(activityData, "Phiên hoạt động", "Trung bình theo tuần")
        };
    }

    private async Task<AdminDashboardChartsDto> BuildYearChartsAsync(DateOnly today, CancellationToken cancellationToken)
    {
        var monthCharts = await BuildMonthChartsAsync(today, cancellationToken);

        return new AdminDashboardChartsDto
        {
            Period = "year",
            UserRegistrations = BuildSeries(monthCharts.UserRegistrations.Data, "Đăng ký mới", "Theo tháng trong năm"),
            Revenue = BuildSeries(monthCharts.Revenue.Data, "Doanh thu (triệu)", "Theo tháng trong năm"),
            Traffic = BuildSeries(monthCharts.Traffic.Data, "Phiên hoạt động", "Theo tháng trong năm")
        };
    }

    private static ChartSeriesDto BuildSeries(
        IReadOnlyList<ChartDataPointDto> data,
        string seriesName,
        string period) =>
        new()
        {
            Data = data,
            SeriesName = seriesName,
            Period = period,
            Peak = data.Count == 0 ? 0 : data.Max(d => d.Value)
        };
}
