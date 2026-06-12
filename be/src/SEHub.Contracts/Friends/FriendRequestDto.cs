namespace SEHub.Contracts.Friends;

public sealed class FriendRequestDto
{
    public Guid Id { get; init; }
    public Guid SenderId { get; init; }
    public Guid ReceiverId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string SenderUsername { get; init; } = string.Empty;
    public string SenderFullName { get; init; } = string.Empty;
    public string? SenderAvatarUrl { get; init; }
    public string ReceiverUsername { get; init; } = string.Empty;
    public string ReceiverFullName { get; init; } = string.Empty;
    public string? ReceiverAvatarUrl { get; init; }
}
