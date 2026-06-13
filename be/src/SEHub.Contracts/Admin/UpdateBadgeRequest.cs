namespace SEHub.Contracts.Admin;

public sealed class UpdateBadgeRequest
{
    public string? Name { get; init; }
    public string? ConditionJson { get; init; }
}
