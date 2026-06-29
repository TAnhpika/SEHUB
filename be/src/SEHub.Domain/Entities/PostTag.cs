namespace SEHub.Domain.Entities;

public class PostTag
{
    public Guid PostId { get; set; }
    public Guid TagId { get; set; }

    public Post Post { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
