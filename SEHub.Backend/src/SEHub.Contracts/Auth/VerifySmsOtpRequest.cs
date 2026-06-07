namespace SEHub.Contracts.Auth;

public sealed class VerifySmsOtpRequest
{
    public string Phone { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
}
