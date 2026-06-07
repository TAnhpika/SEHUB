using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class ExamAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ExamId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public string AnswersJson { get; set; } = string.Empty;
    public ExamAttemptStatus Status { get; set; }

    public Exam Exam { get; set; } = null!;
}
