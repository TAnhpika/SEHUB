using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class QuestionAttachmentConfiguration : IEntityTypeConfiguration<QuestionAttachment>
{
    public void Configure(EntityTypeBuilder<QuestionAttachment> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => new { a.QuestionId, a.SortOrder });
        builder.Property(a => a.PublicId).HasMaxLength(256).IsRequired();
        builder.Property(a => a.Url).HasMaxLength(1000).IsRequired();

        builder.HasOne(a => a.Question)
            .WithMany(q => q.Attachments)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
