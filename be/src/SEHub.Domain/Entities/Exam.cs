using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class Exam : BaseEntity
{
    public string SubjectCode { get; set; } = string.Empty;
    public string PaperCode { get; set; } = string.Empty;
    public ExamType ExamType { get; set; }
    public ExamStatus Status { get; set; }
    public string ContentHash { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? SubmittedById { get; set; }
    public Guid? RevisionOfExamId { get; set; }
    public string? RejectionReasonCode { get; set; }
    public string? RejectionReasonDetail { get; set; }
    public DateTime? RejectedAt { get; set; }
    public Guid? RejectedById { get; set; }
    public bool IsPinned { get; set; }
    public DateTime? PinnedAt { get; set; }

    public Subject? Subject { get; set; }
    public Exam? RevisionOfExam { get; set; }

    public ICollection<Question> Questions { get; set; } = [];
    public ICollection<ExamAttempt> Attempts { get; set; } = [];
    public ICollection<PracticeSubmission> PracticeSubmissions { get; set; } = [];
    public ICollection<ExamAttachment> Attachments { get; set; } = [];
}
