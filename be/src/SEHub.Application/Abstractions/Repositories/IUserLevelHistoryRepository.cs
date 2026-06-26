using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserLevelHistoryRepository
{
    Task AddAsync(UserLevelHistory history, CancellationToken cancellationToken = default);
    Task<bool> ExistsForUserAndLevelAsync(Guid userId, Guid levelId, CancellationToken cancellationToken = default);
}
