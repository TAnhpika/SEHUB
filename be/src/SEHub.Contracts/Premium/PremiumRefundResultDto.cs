namespace SEHub.Contracts.Premium;

public sealed class PremiumRefundResultDto
{
    public string OrderCode { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public bool IsPremium { get; set; }

    public int AiDailyTokenLimit { get; set; }

    public string Message { get; set; } = string.Empty;
}
