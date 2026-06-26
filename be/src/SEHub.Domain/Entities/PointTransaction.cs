using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class PointTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public string RuleCode { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public Guid? SourceId { get; set; }
    public PointTransactionStatus Status { get; set; } = PointTransactionStatus.Posted;
    public string? MetadataJson { get; set; }
}
