using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => new { a.UserId, a.ExamId });
        builder.HasIndex(a => new { a.UserId, a.ExamId, a.Status })
            .HasFilter($"[{nameof(ExamAttempt.Status)}] = {(int)ExamAttemptStatus.InProgress}");
        builder.Property(a => a.Score).HasPrecision(5, 2);
        builder.Property(a => a.AnswersJson).HasMaxLength(8000);
    }
}
