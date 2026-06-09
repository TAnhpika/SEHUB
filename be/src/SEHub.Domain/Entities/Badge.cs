using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class Badge : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ConditionJson { get; set; } = string.Empty;

    public ICollection<UserBadge> UserBadges { get; set; } = [];
}
