namespace SEHub.Contracts.Admin;

public sealed class AdminVoucherListItemDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public Guid LevelId { get; init; }
    public string? LevelName { get; init; }
    public int DiscountPercent { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime GrantedAt { get; init; }
    public DateTime ExpiresAt { get; init; }
}

public sealed class AdminVoucherStatsDto
{
    public int Total { get; init; }
    public int Active { get; init; }
    public int Used { get; init; }
    public int Expired { get; init; }
    public int Revoked { get; init; }
}

public sealed class GrantAdminVoucherRequest
{
    public Guid UserId { get; init; }
    public Guid LevelId { get; init; }
    public int DiscountPercent { get; init; }
    public int ExpiryDays { get; init; } = 30;
}

public sealed class AdminVoucherListResponse
{
    public IReadOnlyList<AdminVoucherListItemDto> Items { get; init; } = [];
    public AdminVoucherStatsDto Stats { get; init; } = new();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
}
