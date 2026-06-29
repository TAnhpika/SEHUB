using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Users;

public interface IAccountPenaltyService
{
    Task<AccountPenaltyDto> GetForCurrentUserAsync(Guid penaltyId, CancellationToken cancellationToken = default);
    Task<AccountPenaltyDto> GetLatestForCurrentUserAsync(string? penaltyType, CancellationToken cancellationToken = default);
    AccountPenaltyDto Map(UserBan ban);
    AccountPenaltyDto MapFromActiveBan(UserAccount user, UserBan? banRecord);
}

public sealed class AccountPenaltyService : IAccountPenaltyService
{
    private readonly IUserBanRepository _banRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public AccountPenaltyService(
        IUserBanRepository banRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser)
    {
        _banRepository = banRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<AccountPenaltyDto> GetForCurrentUserAsync(
        Guid penaltyId,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var ban = await _banRepository.GetByIdForUserAsync(penaltyId, userId, cancellationToken)
            ?? throw new NotFoundException("AccountPenalty", penaltyId);

        return Map(ban);
    }

    public async Task<AccountPenaltyDto> GetLatestForCurrentUserAsync(
        string? penaltyType,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        BanType? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(penaltyType)
            && Enum.TryParse<BanType>(penaltyType, true, out var parsed))
        {
            typeFilter = parsed;
        }

        var ban = await _banRepository.GetLatestByUserIdAndTypeAsync(userId, typeFilter, cancellationToken)
            ?? throw new NotFoundException("AccountPenalty", userId);

        return Map(ban);
    }

    public AccountPenaltyDto Map(UserBan ban) =>
        new()
        {
            Id = ban.Id,
            PenaltyType = ban.BanType.ToString(),
            PenaltyTypeLabel = MapPenaltyTypeLabel(ban.BanType),
            Reason = string.IsNullOrWhiteSpace(ban.Reason) ? "—" : ban.Reason.Trim(),
            IssuedAt = ban.CreatedAt,
            Until = ban.BanType == BanType.Warning ? null : ban.Until,
            UntilLabel = MapUntilLabel(ban),
        };

    public AccountPenaltyDto MapFromActiveBan(UserAccount user, UserBan? banRecord)
    {
        if (banRecord is not null && banRecord.BanType != BanType.Warning)
        {
            return Map(banRecord);
        }

        return new AccountPenaltyDto
        {
            Id = banRecord?.Id ?? user.Id,
            PenaltyType = BanType.Temp.ToString(),
            PenaltyTypeLabel = "Khóa tạm thời",
            Reason = string.IsNullOrWhiteSpace(user.BanReason) ? "—" : user.BanReason.Trim(),
            IssuedAt = banRecord?.CreatedAt ?? DateTime.UtcNow,
            Until = user.BanUntil,
            UntilLabel = user.BanUntil.HasValue
                ? FormatDateTime(user.BanUntil.Value)
                : "Không xác định",
        };
    }

    private static string MapPenaltyTypeLabel(BanType banType) =>
        banType switch
        {
            BanType.Warning => "Cảnh cáo",
            BanType.Temp => "Khóa tạm thời",
            BanType.Permanent => "Khóa vĩnh viễn",
            _ => banType.ToString(),
        };

    private static string MapUntilLabel(UserBan ban)
    {
        if (ban.BanType == BanType.Warning)
        {
            return "Không áp dụng (cảnh cáo)";
        }

        if (ban.BanType == BanType.Permanent || ban.Until is null)
        {
            return "Vĩnh viễn";
        }

        return FormatDateTime(ban.Until.Value);
    }

    private static string FormatDateTime(DateTime value) =>
        value.ToString("dd/MM/yyyy HH:mm", System.Globalization.CultureInfo.InvariantCulture) + " (UTC)";
}
