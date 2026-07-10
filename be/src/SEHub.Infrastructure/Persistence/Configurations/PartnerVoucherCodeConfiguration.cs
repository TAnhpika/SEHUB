using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PartnerVoucherCodeConfiguration : IEntityTypeConfiguration<PartnerVoucherCode>
{
    public void Configure(EntityTypeBuilder<PartnerVoucherCode> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => new { x.TypeId, x.Status });
        builder.HasIndex(x => x.PaymentOrderId)
            .IsUnique()
            .HasFilter("\"PaymentOrderId\" IS NOT NULL");
        builder.HasIndex(x => x.AssignedUserId);

        builder.Property(x => x.Code).HasMaxLength(120).IsRequired();

        builder.HasOne(x => x.Type)
            .WithMany()
            .HasForeignKey(x => x.TypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.AssignedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.ImportedByAdminId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<PaymentOrder>()
            .WithMany()
            .HasForeignKey(x => x.PaymentOrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
