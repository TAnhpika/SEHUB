using SEHub.Contracts.Users;

namespace SEHub.Application.Users;

public interface IUserBlockService
{
    Task<BlockActionResultDto> BlockAsync(Guid targetUserId, CancellationToken cancellationToken = default);

    Task<BlockActionResultDto> UnblockAsync(Guid targetUserId, CancellationToken cancellationToken = default);

    Task<BlockStatusDto> GetBlockStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default);
}
