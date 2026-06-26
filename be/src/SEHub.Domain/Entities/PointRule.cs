using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class PointRule : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public int Points { get; set; }
    public bool IsActive { get; set; } = true;
    public string? MetadataJson { get; set; }
    public string? Description { get; set; }
}
