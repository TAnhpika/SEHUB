namespace SEHub.Contracts.Auth;

public sealed class RegisterRequest
{
    public string Email { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string? DisplayName { get; init; }
}
