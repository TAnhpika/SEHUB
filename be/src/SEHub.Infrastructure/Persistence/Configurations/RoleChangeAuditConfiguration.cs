using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class RoleChangeAuditConfiguration : IEntityTypeConfiguration<RoleChangeAudit>
{
    public void Configure(EntityTypeBuilder<RoleChangeAudit> builder)
    {
        builder.ToTable("RoleChangeAudits");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action).HasMaxLength(50).IsRequired();
        builder.Property(a => a.FromRole).HasMaxLength(50).IsRequired();
        builder.Property(a => a.ToRole).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Detail).HasMaxLength(500).IsRequired();

        builder.HasIndex(a => a.CreatedAt);
        builder.HasIndex(a => new { a.TargetUserId, a.CreatedAt });
    }
}
