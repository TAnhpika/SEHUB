namespace SEHub.Contracts.Premium;

public sealed class PartnerVoucherDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string TypeCode { get; init; } = string.Empty;
    public string TypeLabel { get; init; } = string.Empty;
    public int DiscountPercent { get; init; }
    public string PartnerName { get; init; } = "FTES";
    public string Status { get; init; } = string.Empty;
    public DateTime? AssignedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}
