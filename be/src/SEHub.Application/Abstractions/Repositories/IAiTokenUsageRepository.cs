using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IAiTokenUsageRepository
{
    Task<AiTokenDailyUsage?> GetTodayUsageAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(AiTokenDailyUsage usage, CancellationToken cancellationToken = default);
    Task UpdateAsync(AiTokenDailyUsage usage, CancellationToken cancellationToken = default);
    Task<int> GetTodayConsumedAsync(Guid userId, CancellationToken cancellationToken = default);
}
