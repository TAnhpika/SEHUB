using SEHub.Application.Gamification.Events;

namespace SEHub.Application.Gamification.Abstractions;

public interface IGamificationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IGamificationEvent;
}
