using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class UserFeedback : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public FeedbackStatus Status { get; set; }
    public string AttachmentUrlsJson { get; set; } = "[]";
}
