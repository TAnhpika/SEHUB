using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class DocumentCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;

    public Subject? Subject { get; set; }
    public ICollection<Document> Documents { get; set; } = [];
}
