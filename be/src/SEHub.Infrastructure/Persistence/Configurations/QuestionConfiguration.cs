using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.HasKey(q => q.Id);
        builder.HasIndex(q => new { q.ExamId, q.OrderIndex });
        builder.Property(q => q.Content).HasMaxLength(4000).IsRequired();
        builder.Property(q => q.QuestionType).HasConversion<int>().HasDefaultValue(QuestionType.SingleChoice);
        builder.Property(q => q.CorrectOptionIdsJson).HasMaxLength(2000).HasDefaultValue("[]");

        builder.HasMany(q => q.Options)
            .WithOne(o => o.Question)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
