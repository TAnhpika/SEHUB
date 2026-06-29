using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Users;

public interface IBanStatusService
{
    Task<UserBan?> GetActiveBanAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class BanStatusService : IBanStatusService
{
    private readonly IUserBanRepository _banRepository;

    public BanStatusService(IUserBanRepository banRepository)
    {
        _banRepository = banRepository;
    }

    public async Task<UserBan?> GetActiveBanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var latest = await _banRepository.GetLatestByUserIdAsync(userId, cancellationToken);
        if (latest is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        return latest.Until is null || latest.Until > now ? latest : null;
    }
}
