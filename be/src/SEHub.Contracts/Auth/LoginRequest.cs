namespace SEHub.Contracts.Auth;

public sealed class LoginRequest
{
    public string EmailOrUsername { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
