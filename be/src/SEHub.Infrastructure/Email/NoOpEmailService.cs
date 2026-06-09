using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Email;

public sealed class NoOpEmailService : IEmailService
{
    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
