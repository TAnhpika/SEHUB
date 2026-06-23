using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Sms;

public sealed class MockSmsService : ISmsService
{
    private readonly ILogger<MockSmsService> _logger;

    public MockSmsService(ILogger<MockSmsService> logger) => _logger = logger;

    public Task SendOtpSmsAsync(string phone, string otpCode, CancellationToken cancellationToken = default)
    {
        var message = $"""
            [SMS OTP]
            Phone: {phone}
            Code: {otpCode}
            """;

        Console.WriteLine(message);
        _logger.LogInformation("[SMS OTP] Phone: {Phone}, Code: {Code}", phone, otpCode);
        return Task.CompletedTask;
    }
}
