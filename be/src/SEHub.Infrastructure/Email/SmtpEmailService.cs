using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<EmailSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string email, string otpCode, CancellationToken cancellationToken = default)
    {
        var smtp = _settings.Smtp;
        if (string.IsNullOrWhiteSpace(smtp.Host))
        {
            throw new InvalidOperationException("Email:Smtp:Host is required when Email:Provider is Smtp.");
        }

        if (string.IsNullOrWhiteSpace(smtp.From))
        {
            throw new InvalidOperationException("Email:Smtp:From is required when Email:Provider is Smtp.");
        }

        if (string.IsNullOrWhiteSpace(smtp.Username) || string.IsNullOrWhiteSpace(smtp.Password))
        {
            throw new InvalidOperationException("Email:Smtp:Username and Email:Smtp:Password are required when Email:Provider is Smtp.");
        }

        var password = smtp.Password.Replace(" ", string.Empty, StringComparison.Ordinal);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(smtp.FromDisplayName, smtp.From));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "SEHub - Ma xac thuc OTP";
        message.Body = new TextPart("plain")
        {
            Text = $"Ma OTP cua ban la: {otpCode}. Ma co hieu luc trong 10 phut."
        };

        try
        {
            using var client = new SmtpClient();
            var socketOptions = smtp.Port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(smtp.Host, smtp.Port, socketOptions, cancellationToken);
            await client.AuthenticateAsync(smtp.Username, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (AuthenticationException ex)
        {
            _logger.LogError(ex, "SMTP authentication failed for {Username} on {Host}", smtp.Username, smtp.Host);
            throw new InvalidOperationException(
                "Không xác thực được SMTP. Kiểm tra Gmail App Password (bật 2FA, tạo mật khẩu ứng dụng mới).",
                ex);
        }

        _logger.LogInformation("OTP email sent to {Email} via SMTP host {Host}", email, smtp.Host);
    }
}
