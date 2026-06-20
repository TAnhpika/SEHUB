namespace SEHub.Contracts.Premium;

public sealed class PremiumRefundBankDetailsRequest
{
    public string OrderCode { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string BankName { get; init; } = string.Empty;
    public string AccountNumber { get; init; } = string.Empty;
    public string AccountName { get; init; } = string.Empty;
    public string? Note { get; init; }
}
