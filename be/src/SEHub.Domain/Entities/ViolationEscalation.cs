using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

/// <summary>
/// Deprecated staging table. Violations queue is UserBans-only; drop in a follow-up migration.
/// Escalate API remains temporarily for compatibility.
/// </summary>
public class ViolationEscalation : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid SourceReportId { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public Guid EscalatedById { get; set; }
}
