using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class DocumentCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Semester { get; set; }
    public string Major { get; set; } = string.Empty;

    public ICollection<Document> Documents { get; set; } = [];
}
