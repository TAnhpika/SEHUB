using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SEHub.Application.Premium;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence;

public static class DbSeeder
{
    private const string AdminEmail = "admin@sehub.local";
    private const string AdminPassword = "Admin@123";
    private const string AdminPremiumPlanCode = "4y";

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<SEHubDbContext>>();
        var context = services.GetRequiredService<SEHubDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var subscriptionService = services.GetRequiredService<ISubscriptionService>();

        try
        {
            await context.Database.MigrateAsync();
            await SubjectSeedData.SyncAsync(context, logger);
            await ExamSchemaMigration.MigrateLegacyExamCodesAsync(context, logger);
            await SeedRolesAsync(roleManager, logger);
            await SeedLevelConfigsAsync(context, logger);
            await SeedSubscriptionPlansAsync(context, logger);
            await BadgeSeedData.SyncAsync(context, logger);
            await PointRuleSeedData.SyncAsync(context, logger);
            await RewardRuleSeedData.SyncAsync(context, logger);
            await MissionSeedData.SyncAsync(context, logger);
            await BattlePassSeedData.SyncAsync(context, logger);
            await SyncLevelVoucherPercentsAsync(context, logger);
            await SeedAdminUserAsync(userManager, context, logger);
            await EnsureAdminPremiumSubscriptionAsync(
                userManager,
                context,
                subscriptionService,
                logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager, ILogger logger)
    {
        foreach (var role in new[] { RoleNames.Student, RoleNames.Moderator, RoleNames.Admin })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                logger.LogInformation("Created role {Role}", role);
            }
        }
    }

    private static async Task SeedLevelConfigsAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.LevelConfigs.AnyAsync())
        {
            return;
        }

        var levels = new[]
        {
            new LevelConfig { Id = Guid.NewGuid(), Name = "Bronze", MinPoints = 0, SortOrder = 0, VoucherPercent = null, CreatedAt = DateTime.UtcNow },
            new LevelConfig { Id = Guid.NewGuid(), Name = "Silver", MinPoints = 100, SortOrder = 1, VoucherPercent = 5, CreatedAt = DateTime.UtcNow },
            new LevelConfig { Id = Guid.NewGuid(), Name = "Gold", MinPoints = 500, SortOrder = 2, VoucherPercent = 10, CreatedAt = DateTime.UtcNow },
            new LevelConfig { Id = Guid.NewGuid(), Name = "Platinum", MinPoints = 2000, SortOrder = 3, VoucherPercent = 20, CreatedAt = DateTime.UtcNow }
        };

        context.LevelConfigs.AddRange(levels);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} level configs", levels.Length);
    }

    private static async Task SeedSubscriptionPlansAsync(SEHubDbContext context, ILogger logger)
    {
        if (await context.SubscriptionPlans.AnyAsync())
        {
            return;
        }

        var plans = new[]
        {
            new SubscriptionPlan { Id = Guid.NewGuid(), Code = "1m", Name = "1 Month", DurationDays = 30, PriceVnd = 48000, CreatedAt = DateTime.UtcNow },
            new SubscriptionPlan { Id = Guid.NewGuid(), Code = "8m", Name = "8 Months", DurationDays = 240, PriceVnd = 200000, CreatedAt = DateTime.UtcNow },
            new SubscriptionPlan { Id = Guid.NewGuid(), Code = "4y", Name = "4 Years", DurationDays = 1460, PriceVnd = 650000, CreatedAt = DateTime.UtcNow }
        };

        context.SubscriptionPlans.AddRange(plans);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} subscription plans", plans.Length);
    }

    private static async Task SeedAdminUserAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ILogger logger)
    {
        var existing = await userManager.FindByEmailAsync(AdminEmail);
        if (existing is not null)
        {
            return;
        }

        var bronzeLevel = await context.LevelConfigs
            .OrderBy(l => l.MinPoints)
            .FirstAsync();

        var adminId = Guid.NewGuid();
        var admin = new ApplicationUser
        {
            Id = adminId,
            UserName = "admin",
            Email = AdminEmail,
            EmailConfirmed = true,
            DisplayName = "SEHub Admin",
            Points = 0,
            LevelId = bronzeLevel.Id,
            StreakCount = 0
        };

        var result = await userManager.CreateAsync(admin, AdminPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create admin user: {errors}");
        }

        await userManager.AddToRoleAsync(admin, RoleNames.Admin);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = adminId,
            Bio = "System administrator",
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded admin user {Email}", AdminEmail);
    }

    private static async Task EnsureAdminPremiumSubscriptionAsync(
        UserManager<ApplicationUser> userManager,
        SEHubDbContext context,
        ISubscriptionService subscriptionService,
        ILogger logger)
    {
        var admin = await userManager.FindByEmailAsync(AdminEmail);
        if (admin is null)
        {
            return;
        }

        var hasActiveSubscription = await context.Subscriptions
            .AnyAsync(s => s.UserId == admin.Id && s.IsActive && s.EndAt > DateTime.UtcNow);

        if (hasActiveSubscription)
        {
            return;
        }

        var plan = await context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Code == AdminPremiumPlanCode);

        if (plan is null)
        {
            logger.LogWarning(
                "Admin premium seed skipped: plan {PlanCode} not found",
                AdminPremiumPlanCode);
            return;
        }

        await subscriptionService.ActivateSubscriptionAsync(admin.Id, plan.Id);
        logger.LogInformation(
            "Activated Premium subscription ({PlanCode}) for admin {Email}",
            AdminPremiumPlanCode,
            AdminEmail);
    }

    private static async Task SyncLevelVoucherPercentsAsync(SEHubDbContext context, ILogger logger)
    {
        var expected = new Dictionary<string, int?>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bronze"] = null,
            ["Silver"] = 5,
            ["Gold"] = 10,
            ["Platinum"] = 20,
        };

        var levels = await context.LevelConfigs.ToListAsync();
        var updated = 0;

        foreach (var level in levels)
        {
            if (!expected.TryGetValue(level.Name, out var voucherPercent))
            {
                continue;
            }

            if (level.VoucherPercent == voucherPercent)
            {
                continue;
            }

            level.VoucherPercent = voucherPercent;
            level.UpdatedAt = DateTime.UtcNow;
            updated++;
        }

        if (updated > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Synced voucher percents for {Count} level configs", updated);
        }
    }
}
