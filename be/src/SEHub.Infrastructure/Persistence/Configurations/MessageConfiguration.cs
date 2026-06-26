using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasIndex(m => new { m.ConversationId, m.SentAt });
        builder.Property(m => m.Content).HasMaxLength(4000);
        builder.Property(m => m.MessageType).HasConversion<string>().HasMaxLength(16);
        builder.Property(m => m.AttachmentPath).HasMaxLength(500);
        builder.Property(m => m.AttachmentPublicId).HasMaxLength(256);
        builder.Property(m => m.AttachmentFileName).HasMaxLength(260);
        builder.Property(m => m.AttachmentMimeType).HasMaxLength(128);

        builder.HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
