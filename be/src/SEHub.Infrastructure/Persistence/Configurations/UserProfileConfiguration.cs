using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => p.UserId).IsUnique();
        builder.HasIndex(p => new { p.Major, p.Semester });
        builder.Property(p => p.AvatarUrl).HasMaxLength(500);
        builder.Property(p => p.AvatarPublicId).HasMaxLength(256);
        builder.Property(p => p.Bio).HasMaxLength(1000);
        builder.Property(p => p.Major).HasMaxLength(100);
        builder.Property(p => p.Gender).HasMaxLength(20);
        builder.Property(p => p.Phone).HasMaxLength(20);
        builder.Property(p => p.Address).HasMaxLength(200);
    }
}
