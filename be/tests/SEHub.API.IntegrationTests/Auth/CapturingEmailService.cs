using SEHub.Application.Abstractions;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class CapturingEmailService : IEmailService
{
    public string? LastEmail { get; private set; }
    public string? LastOtpCode { get; private set; }

    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        LastEmail = email;
        LastOtpCode = otpCode;
        return Task.CompletedTask;
    }

    public void Reset()
    {
        LastEmail = null;
        LastOtpCode = null;
    }
}
