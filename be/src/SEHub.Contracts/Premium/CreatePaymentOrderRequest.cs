namespace SEHub.Contracts.Premium;

public sealed class CreatePaymentOrderRequest
{
    public string PlanCode { get; init; } = string.Empty;
    public bool ApplyRankDiscount { get; init; } = true;
}
