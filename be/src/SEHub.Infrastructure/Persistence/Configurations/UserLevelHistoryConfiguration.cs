using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserLevelHistoryConfiguration : IEntityTypeConfiguration<UserLevelHistory>
{
    public void Configure(EntityTypeBuilder<UserLevelHistory> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.PromotedAt });
        builder.HasOne(x => x.Level)
            .WithMany()
            .HasForeignKey(x => x.LevelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
