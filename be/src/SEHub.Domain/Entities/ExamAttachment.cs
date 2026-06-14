using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class ExamAttachment : BaseEntity
{
    public Guid ExamId { get; set; }
    public string DriveFileId { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }

    public Exam Exam { get; set; } = null!;
}
