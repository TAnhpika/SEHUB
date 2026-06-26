using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class BattlePassSeason : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; }
}
