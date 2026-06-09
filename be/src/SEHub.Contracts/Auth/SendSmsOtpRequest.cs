namespace SEHub.Contracts.Auth;

public sealed class SendSmsOtpRequest
{
    public string Phone { get; init; } = string.Empty;
}
