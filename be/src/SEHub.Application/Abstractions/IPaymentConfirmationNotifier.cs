using SEHub.Contracts.Premium;

namespace SEHub.Application.Abstractions;

public interface IPaymentConfirmationNotifier
{
    Task NotifyPaymentConfirmedAsync(PaymentPaidNotification notification, CancellationToken cancellationToken = default);
}
