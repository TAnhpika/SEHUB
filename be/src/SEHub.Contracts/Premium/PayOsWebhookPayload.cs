namespace SEHub.Contracts.Premium;

public sealed class PayOsWebhookPayload
{
    public string Code { get; init; } = string.Empty;
    public string Desc { get; init; } = string.Empty;
    public PayOsWebhookData? Data { get; init; }
    public string Signature { get; init; } = string.Empty;
}

public sealed class PayOsWebhookData
{
    public long OrderCode { get; init; }
    public decimal Amount { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? AccountNumber { get; init; }
    public string? Reference { get; init; }
    public string? TransactionDateTime { get; init; }
    public string? Currency { get; init; }
    public string? PaymentLinkId { get; init; }
    public string? Code { get; init; }
    public string? Desc { get; init; }
    public string? CounterAccountBankId { get; init; }
    public string? CounterAccountBankName { get; init; }
    public string? CounterAccountName { get; init; }
    public string? CounterAccountNumber { get; init; }
    public string? VirtualAccountName { get; init; }
    public string? VirtualAccountNumber { get; init; }
}
