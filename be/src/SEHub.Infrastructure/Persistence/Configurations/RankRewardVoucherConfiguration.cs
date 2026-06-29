using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class RankRewardVoucherConfiguration : IEntityTypeConfiguration<RankRewardVoucher>
{
    public void Configure(EntityTypeBuilder<RankRewardVoucher> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.LevelId });
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
