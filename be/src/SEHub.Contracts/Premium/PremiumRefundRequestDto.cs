namespace SEHub.Contracts.Premium;

public sealed class PremiumRefundRequestDto
{
    public string OrderCode { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;
}
