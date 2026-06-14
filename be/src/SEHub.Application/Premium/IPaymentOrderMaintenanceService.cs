namespace SEHub.Application.Premium;

public interface IPaymentOrderMaintenanceService
{
    Task ExpireWaitingConfirmationOrdersAsync(CancellationToken cancellationToken = default);
}
