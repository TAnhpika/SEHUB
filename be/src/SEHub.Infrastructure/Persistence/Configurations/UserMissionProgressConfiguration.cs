using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserMissionProgressConfiguration : IEntityTypeConfiguration<UserMissionProgress>
{
    public void Configure(EntityTypeBuilder<UserMissionProgress> builder)
    {
        builder.ToTable("UserMissionProgress");
        builder.HasKey(p => new { p.UserId, p.MissionCode, p.PeriodKey });
        builder.Property(p => p.MissionCode).HasMaxLength(64).IsRequired();
        builder.Property(p => p.PeriodKey).HasMaxLength(32).IsRequired();
        builder.HasIndex(p => new { p.UserId, p.PeriodKey });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
