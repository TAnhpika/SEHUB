using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class AiExamChatThreadConfiguration : IEntityTypeConfiguration<AiExamChatThread>
{
    public void Configure(EntityTypeBuilder<AiExamChatThread> builder)
    {
        builder.HasIndex(thread => new { thread.UserId, thread.ExamId, thread.QuestionId }).IsUnique();
        builder.Property(thread => thread.CreatedAt).IsRequired();
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
