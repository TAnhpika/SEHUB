using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PartnerVoucherTypeConfiguration : IEntityTypeConfiguration<PartnerVoucherType>
{
    public void Configure(EntityTypeBuilder<PartnerVoucherType> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Label).HasMaxLength(120).IsRequired();
        builder.Property(x => x.PartnerName).HasMaxLength(60).IsRequired();
    }
}
