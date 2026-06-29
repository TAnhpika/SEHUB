using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public sealed class UserDailyActivityConfiguration : IEntityTypeConfiguration<UserDailyActivity>
{
    public void Configure(EntityTypeBuilder<UserDailyActivity> builder)
    {
        builder.ToTable("UserDailyActivities");
        builder.HasKey(a => new { a.UserId, a.ActivityDate });

        builder.Property(a => a.ActivityCount)
            .IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
