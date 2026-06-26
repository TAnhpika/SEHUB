using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class GamificationEventInboxConfiguration : IEntityTypeConfiguration<GamificationEventInbox>
{
    public void Configure(EntityTypeBuilder<GamificationEventInbox> builder)
    {
        builder.HasKey(x => x.IdempotencyKey);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256);
        builder.Property(x => x.EventType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Result).HasMaxLength(64).IsRequired();
    }
}
