namespace SEHub.Contracts.Admin;

public sealed class ModeratorWarnUserRequest
{
    public string Reason { get; init; } = string.Empty;
}
