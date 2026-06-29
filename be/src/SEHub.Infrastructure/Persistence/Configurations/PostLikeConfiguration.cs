using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PostLikeConfiguration : IEntityTypeConfiguration<PostLike>
{
    public void Configure(EntityTypeBuilder<PostLike> builder)
    {
        builder.HasKey(l => new { l.PostId, l.UserId });
        builder.HasIndex(l => l.UserId);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
