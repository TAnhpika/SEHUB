using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class QuestionComment : BaseEntity, ISoftDeletable
{
    public Guid ExamId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid AuthorId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedById { get; set; }

    public Question? Question { get; set; }
    public QuestionComment? ParentComment { get; set; }
    public ICollection<QuestionComment> Replies { get; set; } = [];
}
