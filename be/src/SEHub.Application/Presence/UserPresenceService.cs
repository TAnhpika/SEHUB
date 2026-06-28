using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Messaging;

namespace SEHub.Application.Presence;

public sealed class UserPresenceService : IUserPresenceService
{
    private readonly IUserPresenceTracker _tracker;
    private readonly IUserRepository _userRepository;
    private readonly IChatNotifier _chatNotifier;
    private readonly IUnitOfWork _unitOfWork;

    public UserPresenceService(
        IUserPresenceTracker tracker,
        IUserRepository userRepository,
        IChatNotifier chatNotifier,
        IUnitOfWork unitOfWork)
    {
        _tracker = tracker;
        _userRepository = userRepository;
        _chatNotifier = chatNotifier;
        _unitOfWork = unitOfWork;
    }

    public Task<UserPresenceDto> RegisterConnectedAsync(
        Guid userId,
        string connectionId,
        CancellationToken cancellationToken = default) =>
        UpdatePresenceAsync(userId, connectionId, isConnecting: true, cancellationToken);

    public Task<UserPresenceDto> RegisterDisconnectedAsync(
        Guid userId,
        string connectionId,
        CancellationToken cancellationToken = default) =>
        UpdatePresenceAsync(userId, connectionId, isConnecting: false, cancellationToken);

    public Task<UserPresenceDto> PingAsync(Guid userId, CancellationToken cancellationToken = default) =>
        UpdatePresenceAsync(userId, connectionId: null, isConnecting: null, cancellationToken);

    public async Task<UserPresenceDto> GetSnapshotAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var lastSeenAt = await ResolveLastSeenAtAsync(userId, cancellationToken);
        return BuildDto(userId, _tracker.IsOnline(userId), lastSeenAt);
    }

    private async Task<UserPresenceDto> UpdatePresenceAsync(
        Guid userId,
        string? connectionId,
        bool? isConnecting,
        CancellationToken cancellationToken)
    {
        if (connectionId is not null && isConnecting.HasValue)
        {
            if (isConnecting.Value)
            {
                _tracker.AddConnection(userId, connectionId);
            }
            else
            {
                _tracker.RemoveConnection(userId, connectionId);
            }
        }

        var now = DateTime.UtcNow;
        await _userRepository.UpdateLastSeenAtAsync(userId, now, cancellationToken);
        _tracker.SetLastSeen(userId, now);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = BuildDto(userId, _tracker.IsOnline(userId), now);
        await _chatNotifier.NotifyPresenceUpdatedAsync(dto, cancellationToken);
        return dto;
    }

    private async Task<DateTime?> ResolveLastSeenAtAsync(Guid userId, CancellationToken cancellationToken)
    {
        var cached = _tracker.GetLastSeen(userId);
        if (cached.HasValue)
        {
            return cached;
        }

        var fromDb = await _userRepository.GetLastSeenAtAsync(userId, cancellationToken);
        if (fromDb.HasValue)
        {
            _tracker.SetLastSeen(userId, fromDb.Value);
        }

        return fromDb;
    }

    private static UserPresenceDto BuildDto(Guid userId, bool isOnline, DateTime? lastSeenAt) =>
        new()
        {
            UserId = userId,
            IsOnline = isOnline,
            LastSeenAt = lastSeenAt
        };
}
