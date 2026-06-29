using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserFeedbackConfiguration : IEntityTypeConfiguration<UserFeedback>
{
    public void Configure(EntityTypeBuilder<UserFeedback> builder)
    {
        builder.ToTable("UserFeedbacks");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Username).HasMaxLength(100).IsRequired();
        builder.Property(f => f.Description).HasMaxLength(4000).IsRequired();
        builder.Property(f => f.AttachmentUrlsJson).HasMaxLength(8000).HasDefaultValue("[]");
        builder.HasIndex(f => f.Status);
        builder.HasIndex(f => f.CreatedAt);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
