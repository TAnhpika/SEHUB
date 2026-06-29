using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class ViolationEscalationConfiguration : IEntityTypeConfiguration<ViolationEscalation>
{
    public void Configure(EntityTypeBuilder<ViolationEscalation> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.UserId, e.CreatedAt });
        builder.Property(e => e.SourceType).HasMaxLength(64).IsRequired();
        builder.Property(e => e.Reason).HasMaxLength(1000).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(e => e.EscalatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
