using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class DocumentCategoryConfiguration : IEntityTypeConfiguration<DocumentCategory>
{
    public void Configure(EntityTypeBuilder<DocumentCategory> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Major).HasMaxLength(100).IsRequired();
        builder.Property(c => c.SubjectCode).HasMaxLength(20);
        builder.HasIndex(c => new { c.Semester, c.Major });
        builder.HasIndex(c => c.SubjectCode);

        builder.HasOne(c => c.Subject)
            .WithMany()
            .HasForeignKey(c => c.SubjectCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
