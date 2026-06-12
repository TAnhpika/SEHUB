using SEHub.Contracts.Premium;

namespace SEHub.Application.Abstractions;

public interface IPaymentRefundNotificationWebhook
{
    Task NotifyRefundRequestedAsync(
        PremiumRefundNotification notification,
        CancellationToken cancellationToken = default);
}
