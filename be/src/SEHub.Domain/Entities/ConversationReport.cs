using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class ConversationReport : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public ReportStatus Status { get; set; }
    public Guid? ResolvedById { get; set; }
    public string? ResolutionNote { get; set; }

    public Conversation Conversation { get; set; } = null!;
}
