using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ViolationEscalationConfiguration : IEntityTypeConfiguration<ViolationEscalation>
{
    public void Configure(EntityTypeBuilder<ViolationEscalation> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.UserId).IsUnique();
        builder.Property(e => e.SourceType).HasMaxLength(64).IsRequired();
        builder.Property(e => e.Reason).HasMaxLength(1000).IsRequired();
    }
}
