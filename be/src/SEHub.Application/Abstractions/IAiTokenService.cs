using SEHub.Contracts.Profiles;

namespace SEHub.Application.Abstractions;

public interface IAiTokenService
{
    Task<AiTokenStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default);

    Task EnsureCanConsumeAsync(Guid userId, int cost, CancellationToken cancellationToken = default);

    Task<int> RecordConsumptionAsync(Guid userId, int cost, CancellationToken cancellationToken = default);
}
