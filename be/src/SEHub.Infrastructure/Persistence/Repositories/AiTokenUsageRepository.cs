using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class AiTokenUsageRepository : IAiTokenUsageRepository
{
    private readonly SEHubDbContext _context;

    public AiTokenUsageRepository(SEHubDbContext context) => _context = context;

    public Task<AiTokenDailyUsage?> GetTodayUsageAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.AiTokenDailyUsages.FirstOrDefaultAsync(
            u => u.UserId == userId && u.UsageDate == DateOnly.FromDateTime(DateTime.UtcNow),
            cancellationToken);

    public async Task AddAsync(AiTokenDailyUsage usage, CancellationToken cancellationToken = default) =>
        await _context.AiTokenDailyUsages.AddAsync(usage, cancellationToken);

    public Task UpdateAsync(AiTokenDailyUsage usage, CancellationToken cancellationToken = default)
    {
        _context.AiTokenDailyUsages.Update(usage);
        return Task.CompletedTask;
    }

    public async Task<int> GetTodayConsumedAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var usage = await GetTodayUsageAsync(userId, cancellationToken);
        return usage?.TokensConsumed ?? 0;
    }
}
