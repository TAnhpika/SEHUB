namespace SEHub.Contracts.Notifications;

public sealed class NotificationDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Body { get; init; }
    public string? LinkUrl { get; init; }
    public Guid? ActorUserId { get; init; }
    public string? ActorUsername { get; init; }
    public Guid? ReferenceId { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}
