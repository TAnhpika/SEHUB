using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class CommentReportConfiguration : IEntityTypeConfiguration<CommentReport>
{
    public void Configure(EntityTypeBuilder<CommentReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasIndex(r => new { r.CommentId, r.ReporterId, r.Status });
        builder.Property(r => r.Reason).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.ResolutionNote).HasMaxLength(2000);

        builder.HasOne(r => r.Post)
            .WithMany()
            .HasForeignKey(r => r.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Comment)
            .WithMany()
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
