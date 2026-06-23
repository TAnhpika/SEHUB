namespace SEHub.Domain.Entities;

public class UserBlock
{
    public Guid BlockerId { get; set; }
    public Guid BlockedUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
