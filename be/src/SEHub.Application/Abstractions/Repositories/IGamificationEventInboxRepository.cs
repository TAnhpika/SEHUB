namespace SEHub.Application.Abstractions.Repositories;

public interface IGamificationEventInboxRepository
{
    Task<bool> TryAcquireAsync(string idempotencyKey, string eventType, string payloadJson, CancellationToken cancellationToken = default);
}
