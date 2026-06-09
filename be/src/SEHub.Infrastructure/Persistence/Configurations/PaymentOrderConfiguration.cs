using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PaymentOrderConfiguration : IEntityTypeConfiguration<PaymentOrder>
{
    public void Configure(EntityTypeBuilder<PaymentOrder> builder)
    {
        builder.HasKey(o => o.Id);
        builder.HasIndex(o => o.PayOsOrderCode).IsUnique();
        builder.HasIndex(o => o.UserId);
        builder.Property(o => o.PayOsOrderCode).HasMaxLength(50).IsRequired();
        builder.Property(o => o.Amount).HasPrecision(18, 2);
        builder.Property(o => o.QrUrl).HasMaxLength(500);

        builder.HasOne(o => o.Plan)
            .WithMany(p => p.PaymentOrders)
            .HasForeignKey(o => o.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.AuditLogs)
            .WithOne(l => l.Order)
            .HasForeignKey(l => l.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
