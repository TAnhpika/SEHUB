using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class UserProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Major { get; set; }
    public int? Semester { get; set; }
}
