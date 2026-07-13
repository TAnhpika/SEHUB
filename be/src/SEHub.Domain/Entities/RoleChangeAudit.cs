using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class RoleChangeAudit : BaseEntity
{
    public Guid TargetUserId { get; set; }
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string FromRole { get; set; } = string.Empty;
    public string ToRole { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
}
