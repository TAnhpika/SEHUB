using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PostImageConfiguration : IEntityTypeConfiguration<PostImage>
{
    public void Configure(EntityTypeBuilder<PostImage> builder)
    {
        builder.HasKey(i => i.Id);
        builder.HasIndex(i => i.PostId);
        builder.Property(i => i.DriveFileId).HasMaxLength(128);
        builder.Property(i => i.PublicId).HasMaxLength(256);
        builder.Property(i => i.Url).HasMaxLength(2048);

        builder.HasOne(i => i.Post)
            .WithMany(p => p.Images)
            .HasForeignKey(i => i.PostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
