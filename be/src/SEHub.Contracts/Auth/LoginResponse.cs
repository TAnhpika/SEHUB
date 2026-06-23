namespace SEHub.Contracts.Auth;

public sealed class LoginResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public int ExpiresIn { get; init; }
    public string RefreshToken { get; init; } = string.Empty;
    public int RefreshExpiresIn { get; init; }
    public AuthUserDto User { get; init; } = null!;
}
