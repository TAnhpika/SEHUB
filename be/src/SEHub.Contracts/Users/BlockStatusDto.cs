namespace SEHub.Contracts.Users;

public sealed class BlockStatusDto
{
    public bool IsBlockedByMe { get; init; }
    public bool IsBlockedByThem { get; init; }
    public bool IsBlockedEitherWay { get; init; }
}
