using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class RewardRule : BaseEntity
{
    public Guid LevelId { get; set; }
    public int DiscountPercent { get; set; }
    public int ExpiryDays { get; set; } = 30;
    public bool OneTimeOnly { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public LevelConfig? Level { get; set; }
}
