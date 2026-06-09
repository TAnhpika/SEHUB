using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class QuestionOption : BaseEntity
{
    public Guid QuestionId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;

    public Question Question { get; set; } = null!;
}
