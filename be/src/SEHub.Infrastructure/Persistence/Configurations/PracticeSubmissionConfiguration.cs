using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PracticeSubmissionConfiguration : IEntityTypeConfiguration<PracticeSubmission>
{
    public void Configure(EntityTypeBuilder<PracticeSubmission> builder)
    {
        builder.HasKey(s => s.Id);
        builder.HasIndex(s => new { s.ExamId, s.UserId, s.IsLatest });
        builder.Property(s => s.GitHubRepoUrl).HasMaxLength(500).IsRequired();
        builder.Property(s => s.ReviewerComment).HasMaxLength(2000);
    }
}
