namespace SEHub.Application.Gamification.Events;

public interface IGamificationEvent
{
    string EventType { get; }
    string IdempotencyKey { get; }
    Guid UserId { get; }
}
