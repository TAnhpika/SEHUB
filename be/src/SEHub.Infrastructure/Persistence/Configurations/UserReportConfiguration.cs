using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserReportConfiguration : IEntityTypeConfiguration<UserReport>
{
    public void Configure(EntityTypeBuilder<UserReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasIndex(r => new { r.ReportedUserId, r.ReporterId, r.Source, r.Status });
        builder.Property(r => r.Reason).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.ResolutionNote).HasMaxLength(2000);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ReportedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ResolvedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Post>()
            .WithMany()
            .HasForeignKey(r => r.PostId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Exam>()
            .WithMany()
            .HasForeignKey(r => r.ExamId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Question>()
            .WithMany()
            .HasForeignKey(r => r.QuestionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<QuestionComment>()
            .WithMany()
            .HasForeignKey(r => r.QuestionCommentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_UserReports_Source_Context",
            """
            ("Source" = 0 AND "PostId" IS NOT NULL AND "ExamId" IS NULL AND "QuestionId" IS NULL AND "QuestionCommentId" IS NULL)
            OR ("Source" = 1 AND "PostId" IS NULL AND "ExamId" IS NOT NULL AND "QuestionId" IS NOT NULL AND "QuestionCommentId" IS NOT NULL)
            OR ("Source" = 2 AND "PostId" IS NULL AND "ExamId" IS NULL AND "QuestionId" IS NULL AND "QuestionCommentId" IS NULL)
            """));
    }
}
