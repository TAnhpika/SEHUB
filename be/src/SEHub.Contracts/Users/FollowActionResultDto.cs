namespace SEHub.Contracts.Users;

public sealed class FollowActionResultDto
{
    public bool IsFollowing { get; init; }
    public int FollowersCount { get; init; }
    public int FollowingCount { get; init; }
}
