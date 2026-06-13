namespace SEHub.Contracts.Premium;

public sealed class RankVoucherPreviewDto
{
    public string? LevelName { get; init; }
    public int Points { get; init; }
    public int? DiscountPercent { get; init; }
    public bool Eligible { get; init; }
    public string Message { get; init; } = string.Empty;
}
