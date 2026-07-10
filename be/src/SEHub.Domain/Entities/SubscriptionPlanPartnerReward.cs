using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

/// <summary>
/// Maps a subscription plan code (e.g. 8m, 4y) to a partner voucher type code (e.g. ftes_20).
/// </summary>
public class SubscriptionPlanPartnerReward : BaseEntity
{
    public string PlanCode { get; set; } = string.Empty;
    public string PartnerVoucherTypeCode { get; set; } = string.Empty;
}
