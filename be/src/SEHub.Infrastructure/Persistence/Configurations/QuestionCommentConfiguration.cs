using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class QuestionCommentConfiguration : IEntityTypeConfiguration<QuestionComment>
{
    public void Configure(EntityTypeBuilder<QuestionComment> builder)
    {
        builder.ToTable("QuestionComments");
        builder.HasKey(c => c.Id);
        builder.HasIndex(c => new { c.ExamId, c.QuestionId });
        builder.Property(c => c.Content).HasMaxLength(2000).IsRequired();

        builder.HasOne(c => c.Question)
            .WithMany()
            .HasForeignKey(c => c.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Exam>()
            .WithMany()
            .HasForeignKey(c => c.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(c => c.DeletedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
