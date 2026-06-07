using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class AiTokenDailyUsage : BaseEntity
{
    public Guid UserId { get; set; }
    public DateOnly UsageDate { get; set; }
    public int TokensConsumed { get; set; }
}
