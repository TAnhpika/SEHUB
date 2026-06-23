namespace SEHub.Contracts.Messaging;

public sealed class ConversationListItemDto
{
    public Guid ConversationId { get; init; }
    public Guid OtherUserId { get; init; }
    public string OtherUsername { get; init; } = string.Empty;
    public string OtherFullName { get; init; } = string.Empty;
    public string? OtherAvatarUrl { get; init; }
    public string? LastMessagePreview { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public int UnreadCount { get; init; }
}
