namespace SEHub.Contracts.Friends;

public sealed class SendFriendRequestRequest
{
    public Guid TargetUserId { get; init; }
}
