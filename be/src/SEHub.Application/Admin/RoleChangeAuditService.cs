using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public sealed class RoleChangeAuditService : IRoleChangeAuditService
{
    private readonly IRoleChangeAuditRepository _auditRepository;
    private readonly IUserRepository _userRepository;

    public RoleChangeAuditService(
        IRoleChangeAuditRepository auditRepository,
        IUserRepository userRepository)
    {
        _auditRepository = auditRepository;
        _userRepository = userRepository;
    }

    public async Task<PagedResult<RoleChangeAuditItemDto>> ListAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);

        var (items, total) = await _auditRepository.GetPagedAsync(safePage, safePageSize, cancellationToken);

        var userIds = items
            .SelectMany(a => new[] { a.TargetUserId }.Concat(a.ActorId is Guid actor ? [actor] : Array.Empty<Guid>()))
            .Distinct()
            .ToList();

        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var userMap = users.ToDictionary(u => u.Id);

        return new PagedResult<RoleChangeAuditItemDto>
        {
            Items = items.Select(a =>
            {
                userMap.TryGetValue(a.TargetUserId, out var target);
                string? actorUsername = null;
                if (a.ActorId is Guid actorId && userMap.TryGetValue(actorId, out var actor))
                {
                    actorUsername = actor.Username;
                }

                return new RoleChangeAuditItemDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    Detail = a.Detail,
                    TargetUsername = target?.Username ?? string.Empty,
                    ActorUsername = actorUsername,
                    CreatedAt = a.CreatedAt,
                };
            }).ToList(),
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = total,
        };
    }
}
