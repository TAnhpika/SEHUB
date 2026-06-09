namespace SEHub.Contracts.Auth;

public sealed class GoogleAuthRequest
{
    public string IdToken { get; init; } = string.Empty;
}
