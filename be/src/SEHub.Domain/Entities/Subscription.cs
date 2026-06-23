using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class Subscription : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public bool IsActive { get; set; }

    public SubscriptionPlan Plan { get; set; } = null!;
}
