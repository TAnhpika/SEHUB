using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserBanRepository
{
    Task<IReadOnlyList<UserBan>> GetActiveBansAsync(CancellationToken cancellationToken = default);
    Task AddAsync(UserBan ban, CancellationToken cancellationToken = default);
}
