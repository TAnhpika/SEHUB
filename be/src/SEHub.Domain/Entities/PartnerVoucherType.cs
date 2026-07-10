using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class PartnerVoucherType : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public int ValidityDays { get; set; }
    public string PartnerName { get; set; } = "FTES";
}
