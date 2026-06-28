namespace SEHub.Application.Abstractions;

public interface IUserPresenceTracker
{
    void AddConnection(Guid userId, string connectionId);

    bool RemoveConnection(Guid userId, string connectionId);

    bool IsOnline(Guid userId);

    void SetLastSeen(Guid userId, DateTime lastSeenAtUtc);

    DateTime? GetLastSeen(Guid userId);
}
