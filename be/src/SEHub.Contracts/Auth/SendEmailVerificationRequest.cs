namespace SEHub.Contracts.Auth;

public sealed class SendEmailVerificationRequest
{
    public string Email { get; init; } = string.Empty;
}
