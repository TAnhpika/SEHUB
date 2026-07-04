using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public sealed class AdminAuditLogService : IAdminAuditLogService
{
    private const int SnapshotFetchLimit = 300;

    private readonly IAdminActivityReadRepository _activityReadRepository;

    public AdminAuditLogService(IAdminActivityReadRepository activityReadRepository)
    {
        _activityReadRepository = activityReadRepository;
    }

    public async Task<AdminActivityLogPageDto> GetAuditLogsAsync(
        string? type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var normalizedType = NormalizeType(type);

        var snapshot = await _activityReadRepository.GetSnapshotAsync(SnapshotFetchLimit, cancellationToken);
        var filtered = normalizedType is null
            ? snapshot.Events
            : snapshot.Events.Where(item => item.Type.Equals(normalizedType, StringComparison.OrdinalIgnoreCase)).ToList();

        var totalCount = filtered.Count;
        var items = filtered
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToList();

        var stats = BuildStats(filtered);

        return new AdminActivityLogPageDto
        {
            Items = items,
            Stats = stats,
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = totalCount,
        };
    }

    private static string? NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type) || type.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return type.Trim().ToLowerInvariant() switch
        {
            "exam" or "report" or "payment" or "user" => type.Trim().ToLowerInvariant(),
            _ => null,
        };
    }

    private static AdminActivityStatsDto BuildStats(IReadOnlyList<AdminAuditLogItemDto> events) =>
        new()
        {
            All = events.Count,
            Exam = events.Count(item => item.Type == "exam"),
            Report = events.Count(item => item.Type == "report"),
            Payment = events.Count(item => item.Type == "payment"),
            User = events.Count(item => item.Type == "user"),
        };
}
