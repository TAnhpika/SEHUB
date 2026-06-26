using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class LevelConfig : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int MinPoints { get; set; }
    public int SortOrder { get; set; }
    public int? VoucherPercent { get; set; }
}
