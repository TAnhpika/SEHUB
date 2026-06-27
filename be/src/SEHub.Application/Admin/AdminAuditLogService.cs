using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public sealed class AdminAuditLogService : IAdminAuditLogService
{
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly IUserRepository _userRepository;

    public AdminAuditLogService(
        IPaymentAuditLogRepository auditLogRepository,
        IUserRepository userRepository)
    {
        _auditLogRepository = auditLogRepository;
        _userRepository = userRepository;
    }

    public async Task<PagedResult<AdminAuditLogItemDto>> GetAuditLogsAsync(
        string? type,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(type)
            && !type.Equals("payment", StringComparison.OrdinalIgnoreCase)
            && !type.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return new PagedResult<AdminAuditLogItemDto>
            {
                Items = [],
                Page = page,
                PageSize = pageSize,
                TotalCount = 0
            };
        }

        var (items, total) = await _auditLogRepository.GetPagedAsync(page, pageSize, cancellationToken);
        var actorIds = items.Where(l => l.ActorId.HasValue).Select(l => l.ActorId!.Value).Distinct().ToList();
        var actors = await _userRepository.GetByIdsAsync(actorIds, cancellationToken);
        var actorMap = actors.ToDictionary(a => a.Id);

        var dtos = items.Select(log =>
        {
            actorMap.TryGetValue(log.ActorId ?? Guid.Empty, out var actor);
            var detail = PaymentAuditLogFormatter.FormatDetail(log.Action, log.PayloadJson);
            var actorLabel = actor?.Username ?? "hệ thống";

            return new AdminAuditLogItemDto
            {
                Id = log.Id,
                Type = "payment",
                Action = log.Action,
                Detail = detail,
                Text = $"{log.Action} — {actorLabel}: {detail}",
                CreatedAt = log.CreatedAt
            };
        }).ToList();

        return new PagedResult<AdminAuditLogItemDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }
}
