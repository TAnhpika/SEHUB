using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin;

public sealed class AdminVoucherService : IAdminVoucherService
{
    private readonly IRankRewardVoucherRepository _voucherRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILevelConfigRepository _levelRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminVoucherService(
        IRankRewardVoucherRepository voucherRepository,
        IUserRepository userRepository,
        ILevelConfigRepository levelRepository,
        IUnitOfWork unitOfWork)
    {
        _voucherRepository = voucherRepository;
        _userRepository = userRepository;
        _levelRepository = levelRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminVoucherListResponse> ListAsync(
        string? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await _voucherRepository.ListAsync(status, search, page, pageSize, cancellationToken);
        var userIds = items.Select(v => v.UserId).Distinct().ToList();
        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var userMap = users.ToDictionary(u => u.Id);

        var dtos = items.Select(v =>
        {
            userMap.TryGetValue(v.UserId, out var user);
            return MapListItem(v, user);
        }).ToList();

        var statusCounts = await _voucherRepository.GetStatusCountsAsync(cancellationToken);
        var stats = new AdminVoucherStatsDto
        {
            Total = statusCounts.Values.Sum(),
            Active = statusCounts.GetValueOrDefault("active"),
            Used = statusCounts.GetValueOrDefault("used"),
            Expired = statusCounts.GetValueOrDefault("expired"),
            Revoked = statusCounts.GetValueOrDefault("revoked")
        };

        return new AdminVoucherListResponse
        {
            Items = dtos,
            Stats = stats,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminVoucherListItemDto> GrantAsync(
        GrantAdminVoucherRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        if (!user.Role.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Chỉ cấp voucher cho tài khoản Sinh viên.");
        }

        if (user.IsBanned)
        {
            throw new ConflictException("Tài khoản đang bị khóa — không thể cấp voucher.");
        }

        if (request.DiscountPercent is < 1 or > 100)
        {
            throw new ConflictException("DiscountPercent phải từ 1 đến 100.");
        }

        if (request.ExpiryDays is < 1 or > 365)
        {
            throw new ConflictException("ExpiryDays phải từ 1 đến 365.");
        }

        _ = await _levelRepository.GetByIdAsync(request.LevelId, cancellationToken)
            ?? throw new NotFoundException("LevelConfig", request.LevelId);

        var now = DateTime.UtcNow;
        var voucher = new RankRewardVoucher
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            LevelId = request.LevelId,
            DiscountPercent = request.DiscountPercent,
            Status = VoucherStatus.Active,
            GrantedAt = now,
            ExpiresAt = now.AddDays(request.ExpiryDays),
            CreatedAt = now
        };

        await _voucherRepository.AddAsync(voucher, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        voucher.Level = await _levelRepository.GetByIdAsync(request.LevelId, cancellationToken);
        return MapListItem(voucher, user);
    }

    public async Task RevokeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _ = await _voucherRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("RankRewardVoucher", id);

        var revoked = await _voucherRepository.RevokeAsync(id, cancellationToken);
        if (!revoked)
        {
            throw new ConflictException("Chỉ thu hồi voucher đang hiệu lực.");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static AdminVoucherListItemDto MapListItem(RankRewardVoucher voucher, Models.UserAccount? user) =>
        new()
        {
            Id = voucher.Id,
            UserId = voucher.UserId,
            Username = user?.Username ?? string.Empty,
            DisplayName = user?.DisplayName ?? string.Empty,
            LevelId = voucher.LevelId,
            LevelName = voucher.Level?.Name,
            DiscountPercent = voucher.DiscountPercent,
            Status = voucher.Status.ToString().ToLowerInvariant(),
            GrantedAt = voucher.GrantedAt,
            ExpiresAt = voucher.ExpiresAt
        };
}
