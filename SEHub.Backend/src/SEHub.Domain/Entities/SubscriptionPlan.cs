using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public decimal PriceVnd { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = [];
    public ICollection<PaymentOrder> PaymentOrders { get; set; } = [];
}
