namespace SEHub.Contracts.Friends;

public sealed class FriendStatusDto
{
    public string Status { get; init; } = "None";
    public Guid? RequestId { get; init; }
}
