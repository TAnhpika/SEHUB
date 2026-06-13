using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => new { e.Semester, e.Major, e.ExamType });
        builder.Property(e => e.Code).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Major).HasMaxLength(100).IsRequired();
        builder.Property(e => e.ContentHash).HasMaxLength(64).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(4000);
        builder.Property(e => e.AssetUrl).HasMaxLength(500);
        builder.HasIndex(e => e.SubmittedById);

        builder.HasMany(e => e.Questions)
            .WithOne(q => q.Exam)
            .HasForeignKey(q => q.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Attempts)
            .WithOne(a => a.Exam)
            .HasForeignKey(a => a.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.PracticeSubmissions)
            .WithOne(s => s.Exam)
            .HasForeignKey(s => s.ExamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
