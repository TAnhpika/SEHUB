using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class QuestionReportConfiguration : IEntityTypeConfiguration<QuestionReport>
{
    public void Configure(EntityTypeBuilder<QuestionReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.QuestionId, r.ReporterId, r.Status });
        builder.Property(r => r.Reason).HasMaxLength(64).IsRequired();
        builder.Property(r => r.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.ResolutionNote).HasMaxLength(2000);

        builder.HasOne(r => r.Question)
            .WithMany()
            .HasForeignKey(r => r.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Exam)
            .WithMany()
            .HasForeignKey(r => r.ExamId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ResolvedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
