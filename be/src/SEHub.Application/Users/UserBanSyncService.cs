using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Application.Users;

public interface IUserBanSyncService
{
    Task SyncUserBanCacheAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class UserBanSyncService : IUserBanSyncService
{
    private readonly IUserRepository _userRepository;
    private readonly IBanStatusService _banStatusService;

    public UserBanSyncService(IUserRepository userRepository, IBanStatusService banStatusService)
    {
        _userRepository = userRepository;
        _banStatusService = banStatusService;
    }

    public async Task SyncUserBanCacheAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activeBan = await _banStatusService.GetActiveBanAsync(userId, cancellationToken);
        if (activeBan is null)
        {
            await _userRepository.UpdateBanAsync(userId, false, null, null, null, cancellationToken);
            return;
        }

        await _userRepository.UpdateBanAsync(
            userId,
            true,
            activeBan.Until,
            activeBan.Reason,
            activeBan.BanType.ToString(),
            cancellationToken);
    }
}
