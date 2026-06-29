using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserBanConfiguration : IEntityTypeConfiguration<UserBan>
{
    public void Configure(EntityTypeBuilder<UserBan> builder)
    {
        builder.HasKey(b => b.Id);
        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => new { b.UserId, b.CreatedAt });
        builder.Property(b => b.Reason).HasMaxLength(1000).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(b => b.ActorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
