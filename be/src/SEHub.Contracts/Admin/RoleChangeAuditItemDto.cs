namespace SEHub.Contracts.Admin;

public sealed class RoleChangeAuditItemDto
{
    public Guid Id { get; init; }
    public string Action { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public string TargetUsername { get; init; } = string.Empty;
    public string? ActorUsername { get; init; }
    public DateTime CreatedAt { get; init; }
}
