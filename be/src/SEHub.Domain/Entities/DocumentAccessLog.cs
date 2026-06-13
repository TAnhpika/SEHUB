using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class DocumentAccessLog : BaseEntity
{
    public Guid DocumentId { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? IpAddress { get; set; }

    public Document Document { get; set; } = null!;
}
