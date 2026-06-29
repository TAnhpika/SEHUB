using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.FilePath).HasMaxLength(500);
        builder.Property(d => d.DriveFileId).HasMaxLength(128);
        builder.Property(d => d.OriginalFileName).HasMaxLength(260);
        builder.Property(d => d.MimeType).HasMaxLength(100).IsRequired();

        builder.HasIndex(d => d.DeletedById);

        builder.HasOne(d => d.Category)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(d => d.DeletedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
