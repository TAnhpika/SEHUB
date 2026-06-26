using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class WeeklyMission : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public int TargetCount { get; set; } = 1;
    public int RewardPoints { get; set; }
    public bool IsActive { get; set; } = true;
}
