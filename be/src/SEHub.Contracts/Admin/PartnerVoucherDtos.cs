namespace SEHub.Contracts.Admin;

public sealed class ImportPartnerVoucherRequest
{
    public string TypeCode { get; init; } = string.Empty;
    public IReadOnlyList<string> Codes { get; init; } = [];
}

public sealed class ImportPartnerVoucherResultDto
{
    public int Imported { get; init; }
    public int DuplicatesSkipped { get; init; }
    public int Invalid { get; init; }
    public int RemainingAvailable { get; init; }
    public string TypeCode { get; init; } = string.Empty;
}

public sealed class AssignPartnerVoucherRequest
{
    public Guid UserId { get; init; }
    public string TypeCode { get; init; } = string.Empty;
}

public sealed class AdminPartnerVoucherListItemDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string TypeCode { get; init; } = string.Empty;
    public string TypeLabel { get; init; } = string.Empty;
    public int DiscountPercent { get; init; }
    public string Status { get; init; } = string.Empty;
    public Guid? AssignedUserId { get; init; }
    public string? AssignedUsername { get; init; }
    public string? AssignedDisplayName { get; init; }
    public Guid? PaymentOrderId { get; init; }
    public DateTime ImportedAt { get; init; }
    public DateTime? AssignedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

public sealed class AdminPartnerVoucherInventoryStatsDto
{
    public int AvailableFtes20 { get; init; }
    public int AvailableFtes100 { get; init; }
    public int Assigned { get; init; }
    public int AvailableTotal { get; init; }
    public int Revoked { get; init; }
    public int Total { get; init; }
}

public sealed class AdminPartnerVoucherListResponse
{
    public IReadOnlyList<AdminPartnerVoucherListItemDto> Items { get; init; } = [];
    public AdminPartnerVoucherInventoryStatsDto Stats { get; init; } = new();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
}

public sealed class PartnerVoucherTypeDto
{
    public string Code { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int DiscountPercent { get; init; }
    public int ValidityDays { get; init; }
    public string PartnerName { get; init; } = string.Empty;
}
