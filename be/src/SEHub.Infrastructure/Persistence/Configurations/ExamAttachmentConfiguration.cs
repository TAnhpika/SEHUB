using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ExamAttachmentConfiguration : IEntityTypeConfiguration<ExamAttachment>
{
    public void Configure(EntityTypeBuilder<ExamAttachment> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => a.ExamId);
        builder.Property(a => a.DriveFileId).HasMaxLength(128).IsRequired();
        builder.Property(a => a.OriginalFileName).HasMaxLength(260).IsRequired();
        builder.Property(a => a.ContentType).HasMaxLength(128).IsRequired();

        builder.HasOne(a => a.Exam)
            .WithMany(e => e.Attachments)
            .HasForeignKey(a => a.ExamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
