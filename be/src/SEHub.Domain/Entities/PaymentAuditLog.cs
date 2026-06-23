using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class PaymentAuditLog : BaseEntity
{
    public Guid OrderId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? ActorId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;

    public PaymentOrder Order { get; set; } = null!;
}
