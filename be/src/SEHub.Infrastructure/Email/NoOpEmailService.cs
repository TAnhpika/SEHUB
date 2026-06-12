using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;

namespace SEHub.Infrastructure.Email;

public sealed class NoOpEmailService : IEmailService
{
    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task SendPaymentConfirmationEmailAsync(
        PaymentConfirmationEmailMessage message,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
