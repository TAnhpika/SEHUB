namespace SEHub.Contracts.Messaging;

public sealed class UserPresenceDto
{
    public Guid UserId { get; init; }
    public bool IsOnline { get; init; }
    public DateTime? LastSeenAt { get; init; }
}
