namespace SEHub.Application.Abstractions;

public interface ISmsService
{
    Task SendOtpSmsAsync(string phone, string otpCode, CancellationToken cancellationToken = default);
}
