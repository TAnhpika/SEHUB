namespace SEHub.Contracts.Users;

public sealed class BlockedUserListItemDto
{
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public Guid? ConversationId { get; init; }
    public DateTime BlockedAt { get; init; }
}
