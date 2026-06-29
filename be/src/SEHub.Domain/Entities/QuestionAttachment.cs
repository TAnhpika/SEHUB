using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class QuestionAttachment : BaseEntity
{
    public Guid QuestionId { get; set; }
    public string PublicId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Question Question { get; set; } = null!;
}
