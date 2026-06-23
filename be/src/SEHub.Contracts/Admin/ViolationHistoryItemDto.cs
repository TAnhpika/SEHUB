namespace SEHub.Contracts.Admin;

public sealed class ViolationHistoryItemDto
{
    public Guid Id { get; init; }
    public string BanType { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public DateTime? Until { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? ActorUsername { get; init; }
}
