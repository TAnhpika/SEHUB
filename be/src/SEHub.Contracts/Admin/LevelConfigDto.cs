namespace SEHub.Contracts.Admin;

public sealed class LevelConfigDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int MinPoints { get; init; }
    public decimal? VoucherPercent { get; init; }
}
