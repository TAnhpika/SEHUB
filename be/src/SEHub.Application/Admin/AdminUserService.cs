using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Application.Trust;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin;

public sealed class AdminUserService : IAdminUserService
{
    private static readonly HashSet<string> AllowedRoles =
    [
        RoleNames.Student,
        RoleNames.Moderator,
        RoleNames.Admin
    ];

    private readonly IUserRepository _userRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly IAiTokenUsageRepository _tokenUsageRepository;
    private readonly IUserBanRepository _banRepository;
    private readonly ILevelConfigRepository _levelConfigRepository;
    private readonly IPostRepository _postRepository;
    private readonly IExamAttemptRepository _examAttemptRepository;
    private readonly IPostReportRepository _reportRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly IRoleChangeAuditRepository _roleChangeAuditRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITrustScoreService _trustScoreService;

    public AdminUserService(
        IUserRepository userRepository,
        ISubscriptionRepository subscriptionRepository,
        IAiTokenUsageRepository tokenUsageRepository,
        IUserBanRepository banRepository,
        ILevelConfigRepository levelConfigRepository,
        IPostRepository postRepository,
        IExamAttemptRepository examAttemptRepository,
        IPostReportRepository reportRepository,
        IPaymentAuditLogRepository auditLogRepository,
        IRoleChangeAuditRepository roleChangeAuditRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        ITrustScoreService trustScoreService)
    {
        _userRepository = userRepository;
        _subscriptionRepository = subscriptionRepository;
        _tokenUsageRepository = tokenUsageRepository;
        _banRepository = banRepository;
        _levelConfigRepository = levelConfigRepository;
        _postRepository = postRepository;
        _examAttemptRepository = examAttemptRepository;
        _reportRepository = reportRepository;
        _auditLogRepository = auditLogRepository;
        _roleChangeAuditRepository = roleChangeAuditRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _trustScoreService = trustScoreService;
    }

    public async Task<PagedResult<AdminUserListItemDto>> GetUsersAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetPagedAsync(page, pageSize, search, cancellationToken);
        var total = await _userRepository.CountAsync(search, cancellationToken);

        var items = new List<AdminUserListItemDto>();
        foreach (var user in users)
        {
            var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(user.Id, cancellationToken);
            var level = await _levelConfigRepository.GetForPointsAsync(user.Points, cancellationToken);
            var trust = await _trustScoreService.GetForUserAsync(user.Id, cancellationToken);
            items.Add(new AdminUserListItemDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role,
                IsBanned = user.IsBanned,
                IsPremium = subscription is not null && subscription.IsActive && subscription.EndAt > DateTime.UtcNow,
                Points = user.Points,
                LevelName = level?.Name ?? user.LevelName,
                CreatedAt = user.CreatedAt,
                TrustScore = trust.Score,
                TrustTier = trust.Tier,
            });
        }

        return new PagedResult<AdminUserListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminUserDetailDto> GetUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User", id);

        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task<AdminUserDetailDto> PatchUserAsync(Guid id, AdminUserPatchRequest request, CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        ValidatePatchPermissions(request);

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User", id);

        if (request.Role is not null)
        {
            await ValidateRoleChangeAsync(user, request.Role, cancellationToken);

            if (!user.Role.Equals(request.Role, StringComparison.OrdinalIgnoreCase))
            {
                var roleAudit = TryBuildModeratorRoleAudit(
                    targetUserId: id,
                    targetUsername: user.Username,
                    fromRole: user.Role,
                    toRole: request.Role,
                    actorId: actorId);

                if (roleAudit is not null)
                {
                    await _roleChangeAuditRepository.AddAsync(roleAudit, cancellationToken);
                }
            }

            await _userRepository.UpdateRoleAsync(id, request.Role, cancellationToken);
        }

        if (request.IsBanned.HasValue || request.BanUntil.HasValue || request.BanType is not null)
        {
            if (_currentUser.Role == RoleNames.Moderator
                && (request.IsBanned == true || user.IsBanned)
                && user.Role is RoleNames.Admin or RoleNames.Moderator)
            {
                throw new ForbiddenException("Moderators cannot ban staff accounts.");
            }

            var isBanned = request.IsBanned ?? user.IsBanned;
            var banType = ParseBanType(request.BanType);

            var banReason = string.IsNullOrWhiteSpace(request.BanReason)
                ? user.BanReason
                : HtmlContentHelper.ToPlainText(request.BanReason);

            await _userRepository.UpdateBanAsync(
                id,
                isBanned,
                request.BanUntil,
                banReason,
                request.BanType,
                cancellationToken);

            if (isBanned)
            {
                await _banRepository.AddAsync(new UserBan
                {
                    Id = Guid.NewGuid(),
                    UserId = id,
                    ActorId = actorId,
                    BanType = banType,
                    Until = request.BanUntil,
                    Reason = banReason ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        user = await _userRepository.GetByIdAsync(id, cancellationToken) ?? user;
        return await MapDetailAsync(user, cancellationToken);
    }

    public async Task ResetPasswordAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _ = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User", id);

        var newPassword = Guid.NewGuid().ToString("N")[..12];
        await _userRepository.UpdatePasswordAsync(id, newPassword, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task GrantTokensAsync(Guid id, GrantTokensRequest request, CancellationToken cancellationToken = default)
    {
        _ = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User", id);

        var usage = await _tokenUsageRepository.GetTodayUsageAsync(id, cancellationToken);
        if (usage is null)
        {
            usage = new AiTokenDailyUsage
            {
                Id = Guid.NewGuid(),
                UserId = id,
                UsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
                TokensConsumed = -request.Amount,
                CreatedAt = DateTime.UtcNow
            };
            await _tokenUsageRepository.AddAsync(usage, cancellationToken);
        }
        else
        {
            usage.TokensConsumed -= request.Amount;
            usage.UpdatedAt = DateTime.UtcNow;
            await _tokenUsageRepository.UpdateAsync(usage, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminUserActivityItemDto>> GetUserActivityAsync(
        Guid id,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        _ = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("User", id);

        var (logs, _) = await _auditLogRepository.GetPagedByUserIdAsync(id, 1, limit, cancellationToken);

        return logs.Select(log => new AdminUserActivityItemDto
        {
            Id = log.Id,
            Type = "payment",
            Action = log.Action,
            Text = PaymentAuditLogFormatter.FormatDetail(log.Action, log.PayloadJson),
            CreatedAt = log.CreatedAt
        }).ToList();
    }

    private async Task ValidateRoleChangeAsync(Models.UserAccount user, string role, CancellationToken cancellationToken)
    {
        if (_currentUser.Role != RoleNames.Admin)
        {
            throw new ForbiddenException("Only admins can change user roles.");
        }

        if (!AllowedRoles.Contains(role))
        {
            throw new ForbiddenException("Role must be Student, Moderator, or Admin.");
        }

        if (user.Role == RoleNames.Admin && !role.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
        {
            var adminCount = await _userRepository.CountByRoleAsync(RoleNames.Admin, cancellationToken);
            if (adminCount <= 1)
            {
                throw new ForbiddenException("Cannot demote the last admin account.");
            }
        }
    }

    private static RoleChangeAudit? TryBuildModeratorRoleAudit(
        Guid targetUserId,
        string targetUsername,
        string fromRole,
        string toRole,
        Guid actorId)
    {
        var isGrant = fromRole.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase)
            && toRole.Equals(RoleNames.Moderator, StringComparison.OrdinalIgnoreCase);
        var isRevoke = fromRole.Equals(RoleNames.Moderator, StringComparison.OrdinalIgnoreCase)
            && toRole.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase);

        if (!isGrant && !isRevoke)
        {
            return null;
        }

        return new RoleChangeAudit
        {
            Id = Guid.NewGuid(),
            TargetUserId = targetUserId,
            ActorId = actorId,
            Action = isGrant ? RoleChangeAuditActions.GrantModerator : RoleChangeAuditActions.RevokeModerator,
            FromRole = fromRole,
            ToRole = toRole,
            Detail = isGrant
                ? $"Gán quyền Moderator cho @{targetUsername}"
                : $"Thu hồi quyền Moderator @{targetUsername}",
            CreatedAt = DateTime.UtcNow,
        };
    }

    private void ValidatePatchPermissions(AdminUserPatchRequest request)
    {
        if (_currentUser.Role == RoleNames.Admin)
        {
            return;
        }

        if (_currentUser.Role != RoleNames.Moderator)
        {
            throw new ForbiddenException("Admin access required.");
        }

        if (request.Role is not null)
        {
            throw new ForbiddenException("Moderators cannot change user roles.");
        }

        if (request.BanType is not null
            && !request.BanType.Equals(nameof(BanType.Temp), StringComparison.OrdinalIgnoreCase)
            && !request.BanType.Equals(BanType.Temp.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Moderators can only issue temporary bans.");
        }

        if (request.IsBanned == true && request.BanUntil is null)
        {
            throw new ForbiddenException("Moderators must specify BanUntil for temporary bans.");
        }
    }

    private static BanType ParseBanType(string? banType)
    {
        if (string.IsNullOrWhiteSpace(banType))
        {
            return BanType.Temp;
        }

        return Enum.TryParse<BanType>(banType, true, out var parsed) ? parsed : BanType.Temp;
    }

    private async Task<AdminUserDetailDto> MapDetailAsync(Models.UserAccount user, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(user.Id, cancellationToken);
        var tokensToday = await _tokenUsageRepository.GetTodayConsumedAsync(user.Id, cancellationToken);
        var latestBan = user.IsBanned
            ? await _banRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            : null;

        var postsCount = await _postRepository.CountByAuthorIdAsync(user.Id, cancellationToken);
        var examsCompleted = await _examAttemptRepository.CountSubmittedByUserIdAsync(user.Id, cancellationToken);
        var reportsFiled = await _reportRepository.CountByReporterIdAsync(user.Id, cancellationToken);
        var reportsAgainst = await _reportRepository.CountAgainstAuthorIdAsync(user.Id, cancellationToken);
        var trust = await _trustScoreService.GetForUserAsync(user.Id, cancellationToken);

        return new AdminUserDetailDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role,
            IsBanned = user.IsBanned,
            BanUntil = user.BanUntil,
            BanReason = user.BanReason,
            BanType = latestBan?.BanType.ToString(),
            IsPremium = subscription is not null && subscription.IsActive && subscription.EndAt > DateTime.UtcNow,
            SubscriptionExpiresAt = subscription?.EndAt,
            Points = user.Points,
            LevelName = user.LevelName,
            StreakCount = user.StreakCount,
            AiTokensConsumedToday = tokensToday,
            CreatedAt = user.CreatedAt,
            LastActivityDate = user.LastActivityDate,
            LastLoginAt = user.LastDailyLoginBonusAt,
            PostsCount = postsCount,
            ExamsCompleted = examsCompleted,
            ReportsFiled = reportsFiled,
            ReportsAgainst = reportsAgainst,
            Trust = trust,
        };
    }
}
