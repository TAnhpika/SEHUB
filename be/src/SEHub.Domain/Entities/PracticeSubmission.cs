using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class PracticeSubmission : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ExamId { get; set; }
    public string GitHubRepoUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public PracticeSubmissionStatus Status { get; set; }
    public string? ReviewerComment { get; set; }
    public Guid? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public bool IsLatest { get; set; }

    public Exam Exam { get; set; } = null!;
}
