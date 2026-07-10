using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class SubscriptionPlanPartnerRewardConfiguration : IEntityTypeConfiguration<SubscriptionPlanPartnerReward>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlanPartnerReward> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.PlanCode).IsUnique();
        builder.Property(x => x.PlanCode).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PartnerVoucherTypeCode).HasMaxLength(40).IsRequired();
    }
}
