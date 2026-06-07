using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Email;

public sealed class LoggingEmailService : IEmailService
{
    private readonly ILogger<LoggingEmailService> _logger;

    public LoggingEmailService(ILogger<LoggingEmailService> logger) => _logger = logger;

    public Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        var message = $"""
            [OTP]
            Email: {email}
            Code: {otpCode}
            """;

        Console.WriteLine(message);
        _logger.LogInformation("[OTP] Email: {Email}, Code: {Code}", email, otpCode);
        return Task.CompletedTask;
    }
}
