using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class LevelConfigConfiguration : IEntityTypeConfiguration<LevelConfig>
{
    public void Configure(EntityTypeBuilder<LevelConfig> builder)
    {
        builder.HasKey(l => l.Id);
        builder.HasIndex(l => l.MinPoints);
        builder.Property(l => l.Name).HasMaxLength(50).IsRequired();
    }
}
