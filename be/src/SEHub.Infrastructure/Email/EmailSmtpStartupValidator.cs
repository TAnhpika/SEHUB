using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SEHub.Infrastructure.Email;

public static class EmailSmtpStartupValidator
{
    public static void ValidateAndWarn(IServiceProvider services)
    {
        var settings = services.GetRequiredService<IOptions<EmailSettings>>().Value;
        if (!settings.Provider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("Email.Smtp");
        var smtp = settings.Smtp;
        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(smtp.Host))
        {
            missing.Add("Email:Smtp:Host");
        }

        if (smtp.Port <= 0)
        {
            missing.Add("Email:Smtp:Port");
        }

        if (string.IsNullOrWhiteSpace(smtp.Username))
        {
            missing.Add("Email:Smtp:Username");
        }

        if (string.IsNullOrWhiteSpace(smtp.Password))
        {
            missing.Add("Email:Smtp:Password");
        }

        if (string.IsNullOrWhiteSpace(smtp.From))
        {
            missing.Add("Email:Smtp:From");
        }

        if (missing.Count > 0)
        {
            logger.LogWarning(
                "SMTP email provider is enabled but configuration is incomplete. Missing: {Missing}. " +
                "OTP email delivery will fail until values are supplied via appsettings.Development.Local.json, " +
                "dotnet user-secrets, or environment variables. See EMAIL_SMTP_SETUP_GUIDE.md.",
                string.Join(", ", missing));
            return;
        }

        logger.LogInformation(
            "SMTP email configuration present for host {Host}:{Port}. OTP emails will be sent via SmtpEmailService.",
            smtp.Host,
            smtp.Port);
    }
}
