using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class UserNotification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? LinkUrl { get; set; }
    public Guid? ActorUserId { get; set; }
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
