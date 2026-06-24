using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class QuestionReport : BaseEntity
{
    public Guid QuestionId { get; set; }
    public Guid ExamId { get; set; }
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public ReportStatus Status { get; set; }
    public Guid? ResolvedById { get; set; }
    public string? ResolutionNote { get; set; }

    public Question Question { get; set; } = null!;
    public Exam Exam { get; set; } = null!;
}
