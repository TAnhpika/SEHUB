using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class PaymentOrder : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public string PayOsOrderCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public PaymentOrderStatus Status { get; set; }
    public string? QrUrl { get; set; }
    public DateTime ExpiredAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerificationMethod { get; set; }
    public DateTime? WaitingConfirmationAt { get; set; }

    public SubscriptionPlan Plan { get; set; } = null!;
    public ICollection<PaymentAuditLog> AuditLogs { get; set; } = [];
}
