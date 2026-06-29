using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PostReportConfiguration : IEntityTypeConfiguration<PostReport>
{
    public void Configure(EntityTypeBuilder<PostReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.Property(r => r.Reason).HasMaxLength(1000).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(r => r.ResolvedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
