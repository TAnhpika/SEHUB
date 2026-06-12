using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ConversationReportConfiguration : IEntityTypeConfiguration<ConversationReport>
{
    public void Configure(EntityTypeBuilder<ConversationReport> builder)
    {
        builder.ToTable("ConversationReports");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Reason).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(r => new { r.ConversationId, r.ReporterId, r.Status });

        builder.HasOne(r => r.Conversation)
            .WithMany()
            .HasForeignKey(r => r.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
