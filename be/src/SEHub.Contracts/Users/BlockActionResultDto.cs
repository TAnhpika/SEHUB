namespace SEHub.Contracts.Users;

public sealed class BlockActionResultDto
{
    public Guid UserId { get; init; }
    public bool IsBlockedByMe { get; init; }
}
