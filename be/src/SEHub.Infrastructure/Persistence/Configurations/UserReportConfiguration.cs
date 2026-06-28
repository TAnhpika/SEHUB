using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class UserReportConfiguration : IEntityTypeConfiguration<UserReport>
{
    public void Configure(EntityTypeBuilder<UserReport> builder)
    {
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasIndex(r => new { r.ReportedUserId, r.ReporterId, r.Source, r.Status });
        builder.Property(r => r.Reason).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Detail).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.ResolutionNote).HasMaxLength(2000);
    }
}
