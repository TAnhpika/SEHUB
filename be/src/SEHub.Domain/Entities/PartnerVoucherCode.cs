using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class PartnerVoucherCode : BaseEntity
{
    public Guid TypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public PartnerVoucherStatus Status { get; set; } = PartnerVoucherStatus.Available;
    public Guid? AssignedUserId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public Guid? PaymentOrderId { get; set; }
    public Guid? ImportedByAdminId { get; set; }
    public DateTime ImportedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public PartnerVoucherType? Type { get; set; }
}
