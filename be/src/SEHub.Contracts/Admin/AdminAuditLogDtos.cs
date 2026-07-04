namespace SEHub.Contracts.Admin;

public sealed class AdminAuditLogItemDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string? Detail { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class AdminUserActivityItemDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class AdminActivityStatsDto
{
    public int All { get; init; }
    public int Exam { get; init; }
    public int Report { get; init; }
    public int Payment { get; init; }
    public int User { get; init; }
}

public sealed class AdminActivitySnapshotDto
{
    public IReadOnlyList<AdminAuditLogItemDto> Events { get; init; } = [];
    public AdminActivityStatsDto Stats { get; init; } = new();
}

public sealed class AdminActivityLogPageDto
{
    public IReadOnlyList<AdminAuditLogItemDto> Items { get; init; } = [];
    public AdminActivityStatsDto Stats { get; init; } = new();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
