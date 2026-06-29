using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PaymentOrderConfiguration : IEntityTypeConfiguration<PaymentOrder>
{
    public void Configure(EntityTypeBuilder<PaymentOrder> builder)
    {
        builder.HasKey(o => o.Id);
        builder.HasIndex(o => o.PayOsOrderCode).IsUnique();
        builder.HasIndex(o => o.UserId);
        builder.HasIndex(o => new { o.UserId, o.Status });
        builder.Property(o => o.PayOsOrderCode).HasMaxLength(50).IsRequired();
        builder.Property(o => o.Amount).HasPrecision(18, 2);
        builder.Property(o => o.OriginalAmount).HasPrecision(18, 2);
        builder.Property(o => o.DiscountSource).HasMaxLength(50);
        builder.Property(o => o.QrUrl).HasMaxLength(500);
        builder.Property(o => o.VerificationMethod).HasMaxLength(50);

        builder.HasOne(o => o.Plan)
            .WithMany(p => p.PaymentOrders)
            .HasForeignKey(o => o.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.AuditLogs)
            .WithOne(l => l.Order)
            .HasForeignKey(l => l.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
