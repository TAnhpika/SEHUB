namespace SEHub.Contracts.Admin;

public sealed class AdminAuditLogItemDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string? Detail { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class AdminUserActivityItemDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
