using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;

namespace SEHub.Infrastructure.Notifications;

public sealed class PaymentConfirmationNotifier : IPaymentConfirmationNotifier
{
    private readonly IEmailService _emailService;
    private readonly IPaymentNotificationWebhook _paymentNotificationWebhook;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentConfirmationNotifier> _logger;

    public PaymentConfirmationNotifier(
        IEmailService emailService,
        IPaymentNotificationWebhook paymentNotificationWebhook,
        IConfiguration configuration,
        ILogger<PaymentConfirmationNotifier> logger)
    {
        _emailService = emailService;
        _paymentNotificationWebhook = paymentNotificationWebhook;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task NotifyPaymentConfirmedAsync(
        PaymentPaidNotification notification,
        CancellationToken cancellationToken = default)
    {
        await TrySendEmailAsync(notification, cancellationToken);

        try
        {
            await _paymentNotificationWebhook.NotifyPaymentPaidAsync(notification, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Payment n8n webhook failed for order {OrderId}", notification.OrderId);
        }
    }

    private async Task TrySendEmailAsync(
        PaymentPaidNotification notification,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(notification.UserEmail))
        {
            _logger.LogWarning(
                "Skip payment confirmation email for order {OrderId}: user email is empty",
                notification.OrderId);
            return;
        }

        var message = new PaymentConfirmationEmailMessage
        {
            ToEmail = notification.UserEmail,
            DisplayName = string.IsNullOrWhiteSpace(notification.DisplayName)
                ? notification.UserEmail
                : notification.DisplayName,
            PlanName = notification.PlanName,
            AmountVnd = notification.AmountVnd,
            OrderCode = notification.PayOsOrderCode,
            ExpiresAt = notification.ExpiresAt,
            AppHomeUrl = ResolveAppHomeUrl(),
        };

        try
        {
            await _emailService.SendPaymentConfirmationEmailAsync(message, cancellationToken);
            _logger.LogInformation(
                "Payment confirmation email sent to {Email} for order {OrderId}",
                notification.UserEmail,
                notification.OrderId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Payment confirmation email failed for order {OrderId}",
                notification.OrderId);
        }
    }

    private string ResolveAppHomeUrl()
    {
        var baseUrl = _configuration["Frontend:BaseUrl"]
            ?? _configuration["Cors:AllowedOrigins:0"]
            ?? "http://localhost:5173";

        return $"{baseUrl.TrimEnd('/')}/home";
    }
}
