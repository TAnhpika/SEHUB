using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class GamificationEventInboxRepository : IGamificationEventInboxRepository
{
    private readonly SEHubDbContext _context;

    public GamificationEventInboxRepository(SEHubDbContext context) => _context = context;

    public async Task<bool> TryAcquireAsync(
        string idempotencyKey,
        string eventType,
        string payloadJson,
        CancellationToken cancellationToken = default)
    {
        if (await _context.GamificationEventInboxes.AnyAsync(i => i.IdempotencyKey == idempotencyKey, cancellationToken))
        {
            return false;
        }

        await _context.GamificationEventInboxes.AddAsync(new GamificationEventInbox
        {
            IdempotencyKey = idempotencyKey,
            EventType = eventType,
            PayloadJson = payloadJson,
            ProcessedAt = DateTime.UtcNow,
            Result = "processing"
        }, cancellationToken);

        return true;
    }
}
