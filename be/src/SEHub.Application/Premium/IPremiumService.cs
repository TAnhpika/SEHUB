using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium;

public interface IPremiumService
{
    Task<IReadOnlyList<SubscriptionPlanDto>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<PaymentOrderDto> CreateOrderAsync(CreatePaymentOrderRequest request, CancellationToken cancellationToken = default);
    Task<PaymentOrderDto> GetOrderAsync(Guid orderId, bool markWaitingConfirmation = false, CancellationToken cancellationToken = default);
    Task<SubscriptionStatusDto> GetSubscriptionAsync(CancellationToken cancellationToken = default);
    Task<PaymentOrderDto> ConfirmDevPaymentAsync(Guid orderId, CancellationToken cancellationToken = default);
}
