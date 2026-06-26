using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class UserLevelHistory : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid LevelId { get; set; }
    public int PointsAtPromotion { get; set; }
    public DateTime PromotedAt { get; set; }

    public LevelConfig? Level { get; set; }
}
