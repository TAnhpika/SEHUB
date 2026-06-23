using SEHub.Contracts.Premium;

namespace SEHub.Application.Abstractions;

public interface IEmailService
{
    Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default);

    Task SendPaymentConfirmationEmailAsync(
        PaymentConfirmationEmailMessage message,
        CancellationToken cancellationToken = default);
}
