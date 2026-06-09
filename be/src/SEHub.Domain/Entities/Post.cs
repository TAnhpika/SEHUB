using SEHub.Domain.Common;
using SEHub.Domain.Enums;

namespace SEHub.Domain.Entities;

public class Post : BaseEntity, ISoftDeletable
{
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Tags { get; set; } = string.Empty;
    public PostStatus Status { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedById { get; set; }

    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<PostLike> Likes { get; set; } = [];
    public ICollection<PostReport> Reports { get; set; } = [];
}
