namespace SEHub.Domain.Entities;

public class UserFollow
{
    public Guid FollowerId { get; set; }
    public Guid FollowingId { get; set; }
    public DateTime CreatedAt { get; set; }
}
