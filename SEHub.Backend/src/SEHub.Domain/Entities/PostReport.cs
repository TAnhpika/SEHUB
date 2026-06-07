using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class PostReport : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReportStatus Status { get; set; }
    public Guid? ResolvedById { get; set; }

    public Post Post { get; set; } = null!;
}
