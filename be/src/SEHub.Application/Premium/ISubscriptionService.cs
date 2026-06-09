using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium;

public interface ISubscriptionService
{
    Task<SubscriptionStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default);
    Task ActivateSubscriptionAsync(Guid userId, Guid planId, CancellationToken cancellationToken = default);
}
