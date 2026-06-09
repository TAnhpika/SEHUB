using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserBanConfiguration : IEntityTypeConfiguration<UserBan>
{
    public void Configure(EntityTypeBuilder<UserBan> builder)
    {
        builder.HasKey(b => b.Id);
        builder.HasIndex(b => b.UserId);
        builder.Property(b => b.Reason).HasMaxLength(1000).IsRequired();
    }
}
