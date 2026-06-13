using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
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
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public AdminUserService(
        IUserRepository userRepository,
        ISubscriptionRepository subscriptionRepository,
        IAiTokenUsageRepository tokenUsageRepository,
        IUserBanRepository banRepository,
        ILevelConfigRepository levelConfigRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _subscriptionRepository = subscriptionRepository;
        _tokenUsageRepository = tokenUsageRepository;
        _banRepository = banRepository;
        _levelConfigRepository = levelConfigRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
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
                CreatedAt = user.CreatedAt
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

            await _userRepository.UpdateBanAsync(
                id,
                isBanned,
                request.BanUntil,
                request.BanReason ?? user.BanReason,
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
                    Reason = request.BanReason ?? user.BanReason ?? string.Empty,
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
            LastActivityDate = user.LastActivityDate
        };
    }
}
