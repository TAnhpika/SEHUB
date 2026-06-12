using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class CapturingEmailService : IEmailService
{
    public string? LastEmail { get; private set; }
    public string? LastOtpCode { get; private set; }
    public PaymentConfirmationEmailMessage? LastPaymentConfirmation { get; private set; }

    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        LastEmail = email;
        LastOtpCode = otpCode;
        return Task.CompletedTask;
    }

    public Task SendPaymentConfirmationEmailAsync(
        PaymentConfirmationEmailMessage message,
        CancellationToken cancellationToken = default)
    {
        LastPaymentConfirmation = message;
        LastEmail = message.ToEmail;
        return Task.CompletedTask;
    }

    public void Reset()
    {
        LastEmail = null;
        LastOtpCode = null;
        LastPaymentConfirmation = null;
    }
}
