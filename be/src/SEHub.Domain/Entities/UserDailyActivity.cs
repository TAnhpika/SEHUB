namespace SEHub.Domain.Entities;

public sealed class UserDailyActivity
{
    public Guid UserId { get; set; }
    public DateOnly ActivityDate { get; set; }
    public int ActivityCount { get; set; }
}
