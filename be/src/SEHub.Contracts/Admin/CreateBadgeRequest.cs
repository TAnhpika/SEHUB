namespace SEHub.Contracts.Admin;

public sealed class CreateBadgeRequest
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? ConditionJson { get; init; }
}
