using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence;

internal static class BattlePassSeedData
{
    internal static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.BattlePassSeasons.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;
        var seasonStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var seasonEnd = seasonStart.AddMonths(3);

        context.BattlePassSeasons.Add(new BattlePassSeason
        {
            Id = Guid.NewGuid(),
            Name = $"Season {seasonStart:yyyy-MM}",
            StartsAt = seasonStart,
            EndsAt = seasonEnd,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded default battle pass season");
    }
}
