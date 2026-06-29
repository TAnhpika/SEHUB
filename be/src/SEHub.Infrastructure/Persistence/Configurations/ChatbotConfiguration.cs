using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ChatbotSettingsConfiguration : IEntityTypeConfiguration<ChatbotSettings>
{
    public void Configure(EntityTypeBuilder<ChatbotSettings> builder)
    {
        builder.Property(settings => settings.SystemPrompt).HasMaxLength(4000).IsRequired();
        builder.Property(settings => settings.WelcomeMessage).HasMaxLength(1000).IsRequired();
    }
}

public class ChatbotKnowledgeEntryConfiguration : IEntityTypeConfiguration<ChatbotKnowledgeEntry>
{
    public void Configure(EntityTypeBuilder<ChatbotKnowledgeEntry> builder)
    {
        builder.Property(entry => entry.Title).HasMaxLength(200).IsRequired();
        builder.Property(entry => entry.Content).HasMaxLength(8000).IsRequired();
        builder.Property(entry => entry.Tags).HasMaxLength(500);
        builder.HasIndex(entry => entry.IsActive);
    }
}

public class ChatbotConversationConfiguration : IEntityTypeConfiguration<ChatbotConversation>
{
    public void Configure(EntityTypeBuilder<ChatbotConversation> builder)
    {
        builder.Property(conversation => conversation.Title).HasMaxLength(200).IsRequired();
        builder.HasIndex(conversation => conversation.UserId);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(conversation => conversation.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ChatbotMessageConfiguration : IEntityTypeConfiguration<ChatbotMessage>
{
    public void Configure(EntityTypeBuilder<ChatbotMessage> builder)
    {
        builder.Property(message => message.Role).HasMaxLength(20).IsRequired();
        builder.Property(message => message.Content).HasMaxLength(8000).IsRequired();

        builder.HasOne(message => message.Conversation)
            .WithMany(conversation => conversation.Messages)
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
