namespace SEHub.Contracts.Admin;

public sealed class BadgeAdminDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? ConditionJson { get; init; }
    public int EarnedCount { get; init; }
}
