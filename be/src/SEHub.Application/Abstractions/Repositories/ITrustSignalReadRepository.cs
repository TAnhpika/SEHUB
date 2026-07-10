using SEHub.Application.Trust.Models;

namespace SEHub.Application.Abstractions.Repositories;

public interface ITrustSignalReadRepository
{
    Task<TrustScoreSignals> GetSignalsAsync(Guid userId, CancellationToken cancellationToken = default);
}
