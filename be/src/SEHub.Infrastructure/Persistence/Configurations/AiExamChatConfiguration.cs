using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class AiExamChatThreadConfiguration : IEntityTypeConfiguration<AiExamChatThread>
{
    public void Configure(EntityTypeBuilder<AiExamChatThread> builder)
    {
        builder.HasIndex(thread => new { thread.UserId, thread.ExamId, thread.QuestionId }).IsUnique();
        builder.Property(thread => thread.CreatedAt).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(thread => thread.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Exam>()
            .WithMany()
            .HasForeignKey(thread => thread.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Question>()
            .WithMany()
            .HasForeignKey(thread => thread.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AiExamChatMessageConfiguration : IEntityTypeConfiguration<AiExamChatMessage>
{
    public void Configure(EntityTypeBuilder<AiExamChatMessage> builder)
    {
        builder.Property(message => message.Role).HasMaxLength(20).IsRequired();
        builder.Property(message => message.Content).HasMaxLength(8000).IsRequired();
        builder.Property(message => message.CreatedAt).IsRequired();

        builder.HasOne(message => message.Thread)
            .WithMany(thread => thread.Messages)
            .HasForeignKey(message => message.ThreadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
