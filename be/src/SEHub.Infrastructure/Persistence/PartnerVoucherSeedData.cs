using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence;

public static class PartnerVoucherSeedData
{
    public static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        await UpsertTypeAsync(
            context,
            PartnerVoucherTypeCodes.Ftes20,
            "Voucher FTES 20%",
            discountPercent: 20,
            validityDays: 90,
            logger);

        await UpsertTypeAsync(
            context,
            PartnerVoucherTypeCodes.Ftes100,
            "Voucher FTES 100%",
            discountPercent: 100,
            validityDays: 365,
            logger);

        await UpsertPlanRewardAsync(context, "8m", PartnerVoucherTypeCodes.Ftes20, logger);
        await UpsertPlanRewardAsync(context, "4y", PartnerVoucherTypeCodes.Ftes100, logger);

        await context.SaveChangesAsync();
    }

    private static async Task UpsertTypeAsync(
        SEHubDbContext context,
        string code,
        string label,
        int discountPercent,
        int validityDays,
        ILogger logger)
    {
        var existing = await context.PartnerVoucherTypes.FirstOrDefaultAsync(t => t.Code == code);
        if (existing is null)
        {
            context.PartnerVoucherTypes.Add(new PartnerVoucherType
            {
                Id = Guid.NewGuid(),
                Code = code,
                Label = label,
                DiscountPercent = discountPercent,
                ValidityDays = validityDays,
                PartnerName = "FTES",
                CreatedAt = DateTime.UtcNow,
            });
            logger.LogInformation("Seeded partner voucher type {Code}", code);
            return;
        }

        existing.Label = label;
        existing.DiscountPercent = discountPercent;
        existing.ValidityDays = validityDays;
        existing.PartnerName = "FTES";
        existing.UpdatedAt = DateTime.UtcNow;
    }

    private static async Task UpsertPlanRewardAsync(
        SEHubDbContext context,
        string planCode,
        string typeCode,
        ILogger logger)
    {
        var existing = await context.SubscriptionPlanPartnerRewards
            .FirstOrDefaultAsync(r => r.PlanCode == planCode);
        if (existing is null)
        {
            context.SubscriptionPlanPartnerRewards.Add(new SubscriptionPlanPartnerReward
            {
                Id = Guid.NewGuid(),
                PlanCode = planCode,
                PartnerVoucherTypeCode = typeCode,
                CreatedAt = DateTime.UtcNow,
            });
            logger.LogInformation("Seeded plan partner reward {Plan} → {Type}", planCode, typeCode);
            return;
        }

        existing.PartnerVoucherTypeCode = typeCode;
        existing.UpdatedAt = DateTime.UtcNow;
    }
}
