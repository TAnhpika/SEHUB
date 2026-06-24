using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserProfile>> GetByUserIdsAsync(
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken = default);
    Task<UserProfile?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task AddAsync(UserProfile profile, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserProfile profile, CancellationToken cancellationToken = default);
}
