using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class OtpVerificationConfiguration : IEntityTypeConfiguration<OtpVerification>
{
    public void Configure(EntityTypeBuilder<OtpVerification> builder)
    {
        builder.HasKey(o => o.Id);
        builder.HasIndex(o => new { o.Email, o.Purpose });
        builder.HasIndex(o => new { o.Phone, o.Purpose });
        builder.Property(o => o.Email).HasMaxLength(256).IsRequired();
        builder.Property(o => o.Phone).HasMaxLength(20);
        builder.Property(o => o.CodeHash).HasMaxLength(256).IsRequired();
        builder.Property(o => o.IsUsed).HasDefaultValue(false);
    }
}
