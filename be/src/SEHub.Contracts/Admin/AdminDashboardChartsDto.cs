namespace SEHub.Contracts.Admin;

public sealed class AdminDashboardChartsDto
{
    public string Period { get; init; } = "month";
    public ChartSeriesDto UserRegistrations { get; init; } = new();
    public ChartSeriesDto Revenue { get; init; } = new();
    public ChartSeriesDto Traffic { get; init; } = new();
}

public sealed class ChartSeriesDto
{
    public IReadOnlyList<ChartDataPointDto> Data { get; init; } = [];
    public string SeriesName { get; init; } = string.Empty;
    public string Period { get; init; } = string.Empty;
    public decimal Peak { get; init; }
}

public sealed class ChartDataPointDto
{
    public string Label { get; init; } = string.Empty;
    public decimal Value { get; init; }
}
