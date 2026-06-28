using SEHub.Contracts.Messaging;

namespace SEHub.Application.Abstractions;

public interface IUserPresenceService
{
    Task<UserPresenceDto> RegisterConnectedAsync(
        Guid userId,
        string connectionId,
        CancellationToken cancellationToken = default);

    Task<UserPresenceDto> RegisterDisconnectedAsync(
        Guid userId,
        string connectionId,
        CancellationToken cancellationToken = default);

    Task<UserPresenceDto> PingAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<UserPresenceDto> GetSnapshotAsync(Guid userId, CancellationToken cancellationToken = default);
}
