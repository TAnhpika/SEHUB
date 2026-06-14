using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class DocumentAccessLogConfiguration : IEntityTypeConfiguration<DocumentAccessLog>
{
    public void Configure(EntityTypeBuilder<DocumentAccessLog> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Action).HasMaxLength(50).IsRequired();
        builder.Property(l => l.IpAddress).HasMaxLength(64);
        builder.HasIndex(l => l.DocumentId);
        builder.HasIndex(l => l.UserId);
        builder.HasIndex(l => l.CreatedAt);

        builder.HasOne(l => l.Document)
            .WithMany()
            .HasForeignKey(l => l.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
