using SEHub.Application.Abstractions;

namespace SEHub.Application.Presence;

public sealed class UserPresenceTracker : IUserPresenceTracker
{
    private readonly object _lock = new();
    private readonly Dictionary<Guid, HashSet<string>> _connections = new();
    private readonly Dictionary<Guid, DateTime> _lastSeen = new();

    public void AddConnection(Guid userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(userId, out var connections))
            {
                connections = new HashSet<string>(StringComparer.Ordinal);
                _connections[userId] = connections;
            }

            connections.Add(connectionId);
        }
    }

    public bool RemoveConnection(Guid userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(userId, out var connections))
            {
                return false;
            }

            connections.Remove(connectionId);
            if (connections.Count > 0)
            {
                return true;
            }

            _connections.Remove(userId);
            return false;
        }
    }

    public bool IsOnline(Guid userId)
    {
        lock (_lock)
        {
            return _connections.TryGetValue(userId, out var connections) && connections.Count > 0;
        }
    }

    public void SetLastSeen(Guid userId, DateTime lastSeenAtUtc)
    {
        lock (_lock)
        {
            _lastSeen[userId] = lastSeenAtUtc;
        }
    }

    public DateTime? GetLastSeen(Guid userId)
    {
        lock (_lock)
        {
            return _lastSeen.TryGetValue(userId, out var lastSeen) ? lastSeen : null;
        }
    }
}
