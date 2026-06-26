using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class BattlePassSeasonConfiguration : IEntityTypeConfiguration<BattlePassSeason>
{
    public void Configure(EntityTypeBuilder<BattlePassSeason> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(128).IsRequired();
        builder.HasIndex(x => x.IsActive);
    }
}
