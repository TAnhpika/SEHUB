using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence;

internal static class RewardRuleSeedData
{
    internal static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        var levels = await context.LevelConfigs.OrderBy(l => l.MinPoints).ToListAsync();
        var gold = levels.FirstOrDefault(l => l.Name.Equals("Gold", StringComparison.OrdinalIgnoreCase));
        var platinum = levels.FirstOrDefault(l => l.Name.Equals("Platinum", StringComparison.OrdinalIgnoreCase));

        if (gold is not null)
        {
            await UpsertAsync(context, gold.Id, 10, logger);
        }

        if (platinum is not null)
        {
            await UpsertAsync(context, platinum.Id, 20, logger);
        }

        await context.SaveChangesAsync();
    }

    private static async Task UpsertAsync(SEHubDbContext context, Guid levelId, int discountPercent, ILogger logger)
    {
        var existing = await context.RewardRules.FirstOrDefaultAsync(r => r.LevelId == levelId);
        if (existing is null)
        {
            context.RewardRules.Add(new RewardRule
            {
                Id = Guid.NewGuid(),
                LevelId = levelId,
                DiscountPercent = discountPercent,
                ExpiryDays = 30,
                OneTimeOnly = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            logger.LogInformation("Seeded reward rule for level {LevelId} at {Percent}%", levelId, discountPercent);
        }
        else
        {
            existing.DiscountPercent = discountPercent;
            existing.IsActive = true;
            existing.UpdatedAt = DateTime.UtcNow;
        }
    }
}
