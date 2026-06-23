using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class AiTokenDailyUsageConfiguration : IEntityTypeConfiguration<AiTokenDailyUsage>
{
    public void Configure(EntityTypeBuilder<AiTokenDailyUsage> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => new { u.UserId, u.UsageDate }).IsUnique();
    }
}
