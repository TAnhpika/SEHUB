namespace SEHub.Contracts.Auth;

public sealed class VerifyEmailRequest
{
    public string Email { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
}
