using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class RankRewardVoucher : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid LevelId { get; set; }
    public int DiscountPercent { get; set; }
    public VoucherStatus Status { get; set; } = VoucherStatus.Active;
    public DateTime ExpiresAt { get; set; }
    public DateTime GrantedAt { get; set; }

    public LevelConfig? Level { get; set; }
}
