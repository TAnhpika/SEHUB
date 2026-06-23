using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;
using SEHub.Domain.Exceptions;

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
        ValidateSmtpConfig(smtp);

        var password = NormalizeAppPassword(smtp.Password);
        var username = smtp.Username.Trim();

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
            await SendViaSmtpAsync(smtp, message, username, password, cancellationToken);
        }
        catch (Exception ex) when (ex is AuthenticationException or SmtpCommandException or SmtpProtocolException)
        {
            throw CreateDeliveryException(ex, username, smtp.Host);
        }

        _logger.LogInformation("OTP email sent to {Email} via SMTP host {Host}", email, smtp.Host);
    }

    public async Task SendPaymentConfirmationEmailAsync(
        PaymentConfirmationEmailMessage message,
        CancellationToken cancellationToken = default)
    {
        var smtp = _settings.Smtp;
        ValidateSmtpConfig(smtp);

        var password = NormalizeAppPassword(smtp.Password);
        var username = smtp.Username.Trim();
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(smtp.FromDisplayName, smtp.From));
        mimeMessage.To.Add(MailboxAddress.Parse(message.ToEmail));
        mimeMessage.Subject = PaymentConfirmationEmailComposer.BuildSubject();

        var bodyBuilder = new BodyBuilder
        {
            TextBody = PaymentConfirmationEmailComposer.BuildPlainText(message),
            HtmlBody = PaymentConfirmationEmailComposer.BuildHtml(message),
        };
        mimeMessage.Body = bodyBuilder.ToMessageBody();

        try
        {
            await SendViaSmtpAsync(smtp, mimeMessage, username, password, cancellationToken);
        }
        catch (Exception ex) when (ex is AuthenticationException or SmtpCommandException or SmtpProtocolException)
        {
            throw CreateDeliveryException(ex, username, smtp.Host);
        }

        _logger.LogInformation(
            "Payment confirmation email sent to {Email} via SMTP host {Host}",
            message.ToEmail,
            smtp.Host);
    }

    private static string NormalizeAppPassword(string password) =>
        password.Replace(" ", string.Empty, StringComparison.Ordinal).Trim();

    private static async Task SendViaSmtpAsync(
        SmtpSettings smtp,
        MimeMessage message,
        string username,
        string password,
        CancellationToken cancellationToken)
    {
        using var client = new SmtpClient
        {
            Timeout = 15_000,
        };
        var socketOptions = smtp.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;

        await client.ConnectAsync(smtp.Host, smtp.Port, socketOptions, cancellationToken);
        client.AuthenticationMechanisms.Remove("XOAUTH2");
        await client.AuthenticateAsync(username, password, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private EmailDeliveryException CreateDeliveryException(Exception ex, string username, string host)
    {
        _logger.LogError(ex, "SMTP delivery failed for {Username} on {Host}", username, host);
        return new EmailDeliveryException(
            "Không gửi được email. Kiểm tra cấu hình SMTP (Gmail App Password) hoặc thử lại sau.",
            ex);
    }

    private static void ValidateSmtpConfig(SmtpSettings smtp)
    {
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
    }
}
