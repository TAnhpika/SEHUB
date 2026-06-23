using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public sealed class UserDailyActivityConfiguration : IEntityTypeConfiguration<UserDailyActivity>
{
    public void Configure(EntityTypeBuilder<UserDailyActivity> builder)
    {
        builder.ToTable("UserDailyActivities");
        builder.HasKey(a => new { a.UserId, a.ActivityDate });

        builder.Property(a => a.ActivityCount)
            .IsRequired();
    }
}
