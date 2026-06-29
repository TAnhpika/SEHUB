using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class Question : BaseEntity
{
    public Guid ExamId { get; set; }
    public int OrderIndex { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; } = QuestionType.SingleChoice;
    public int? RequiredSelectCount { get; set; }
    public Guid? CorrectOptionId { get; set; }
    public string CorrectOptionIdsJson { get; set; } = "[]";

    public Exam Exam { get; set; } = null!;
    public ICollection<QuestionOption> Options { get; set; } = [];
    public ICollection<QuestionAttachment> Attachments { get; set; } = [];
}
