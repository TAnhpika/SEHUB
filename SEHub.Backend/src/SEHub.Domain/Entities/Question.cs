using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class Question : BaseEntity
{
    public Guid ExamId { get; set; }
    public int OrderIndex { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? CorrectOptionId { get; set; }

    public Exam Exam { get; set; } = null!;
    public ICollection<QuestionOption> Options { get; set; } = [];
}
