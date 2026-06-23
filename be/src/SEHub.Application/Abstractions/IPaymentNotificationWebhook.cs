using SEHub.Contracts.Premium;

namespace SEHub.Application.Abstractions;

public interface IPaymentNotificationWebhook
{
    Task NotifyPaymentPaidAsync(PaymentPaidNotification notification, CancellationToken cancellationToken = default);
}
