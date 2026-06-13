using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class PostImage : BaseEntity
{
    public Guid PostId { get; set; }
    public string DriveFileId { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Post Post { get; set; } = null!;
}
