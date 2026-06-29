namespace SEHub.Domain.Entities;

public class UserMissionProgress
{
    public Guid UserId { get; set; }
    public string MissionCode { get; set; } = string.Empty;
    public string PeriodKey { get; set; } = string.Empty;
    public int ProgressCount { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
