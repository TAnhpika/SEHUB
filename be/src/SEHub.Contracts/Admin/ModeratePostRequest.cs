namespace SEHub.Contracts.Admin;

public sealed class ModeratePostRequest
{
    public string Action { get; init; } = string.Empty;
    public string? Note { get; init; }
}
