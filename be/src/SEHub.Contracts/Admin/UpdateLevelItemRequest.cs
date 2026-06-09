namespace SEHub.Contracts.Admin;

public sealed class UpdateLevelItemRequest
{
    public string Name { get; init; } = string.Empty;
    public int MinPoints { get; init; }
    public decimal? VoucherPercent { get; init; }
}
