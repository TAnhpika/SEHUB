using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium;

public interface IN8nPremiumActivationService
{
    Task<N8nPremiumActivationResultDto> ActivateAsync(
        N8NPremiumActivationDto request,
        CancellationToken cancellationToken = default);
}
