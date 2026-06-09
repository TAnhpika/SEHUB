using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class UserBan : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ActorId { get; set; }
    public BanType BanType { get; set; }
    public DateTime? Until { get; set; }
    public string Reason { get; set; } = string.Empty;
}
