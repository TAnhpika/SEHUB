using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Configurations;

public class PaymentAuditLogConfiguration : IEntityTypeConfiguration<PaymentAuditLog>
{
    public void Configure(EntityTypeBuilder<PaymentAuditLog> builder)
    {
        builder.HasKey(l => l.Id);
        builder.HasIndex(l => l.OrderId);
        builder.Property(l => l.Action).HasMaxLength(100).IsRequired();
        builder.Property(l => l.PayloadJson).HasMaxLength(8000);
    }
}
