using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Premium;

public sealed partial class PartnerVoucherService : IPartnerVoucherService
{
    private static readonly Regex CodePattern = ValidCodeRegex();

    private readonly IPartnerVoucherRepository _partnerVoucherRepository;
    private readonly IPaymentOrderRepository _orderRepository;
    private readonly ISubscriptionPlanRepository _planRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PartnerVoucherService> _logger;

    public PartnerVoucherService(
        IPartnerVoucherRepository partnerVoucherRepository,
        IPaymentOrderRepository orderRepository,
        ISubscriptionPlanRepository planRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        ILogger<PartnerVoucherService> logger)
    {
        _partnerVoucherRepository = partnerVoucherRepository;
        _orderRepository = orderRepository;
        _planRepository = planRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task TryAssignForPaidOrderAsync(Guid paymentOrderId, CancellationToken cancellationToken = default)
    {
        var existing = await _partnerVoucherRepository.GetByPaymentOrderIdAsync(paymentOrderId, cancellationToken);
        if (existing is not null)
        {
            return;
        }

        var order = await _orderRepository.GetByIdAsync(paymentOrderId, cancellationToken);
        if (order is null || order.Status != PaymentOrderStatus.Paid)
        {
            return;
        }

        var plan = order.Plan ?? await _planRepository.GetByIdAsync(order.PlanId, cancellationToken);
        if (plan is null)
        {
            return;
        }

        var typeCode = await _partnerVoucherRepository.GetTypeCodeForPlanAsync(plan.Code, cancellationToken);
        if (string.IsNullOrWhiteSpace(typeCode))
        {
            return;
        }

        var type = await _partnerVoucherRepository.GetTypeByCodeAsync(typeCode, cancellationToken);
        if (type is null)
        {
            _logger.LogWarning("Partner voucher type {TypeCode} missing for plan {PlanCode}", typeCode, plan.Code);
            return;
        }

        var code = await _partnerVoucherRepository.TryClaimAvailableAsync(type.Id, cancellationToken);
        if (code is null)
        {
            _logger.LogWarning(
                "Partner voucher pool empty for type {TypeCode} on order {OrderId}",
                typeCode,
                paymentOrderId);
            await _workflowNotifications.NotifyAdminsPartnerVoucherPoolEmptyAsync(
                typeCode,
                plan.Code,
                paymentOrderId,
                cancellationToken);
            return;
        }

        var now = DateTime.UtcNow;
        code.Status = PartnerVoucherStatus.Assigned;
        code.AssignedUserId = order.UserId;
        code.AssignedAt = now;
        code.PaymentOrderId = paymentOrderId;
        code.ExpiresAt = now.AddDays(type.ValidityDays);
        code.UpdatedAt = now;
        code.Type ??= type;

        await _partnerVoucherRepository.UpdateAsync(code, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateAsync(
            order.UserId,
            NotificationType.Token,
            $"Bạn nhận {type.Label}!",
            $"Mã FTES: {code.Code} (hết hạn {code.ExpiresAt:dd/MM/yyyy}). Đổi trên cổng FTES.",
            "/home/premium",
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyList<PartnerVoucherDto>> ListMyAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var items = await _partnerVoucherRepository.GetAssignedByUserIdAsync(userId, cancellationToken);
        return items.Select(MapUserDto).ToList();
    }

    public async Task<ImportPartnerVoucherResultDto> ImportAsync(
        ImportPartnerVoucherRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.TypeCode))
        {
            throw new ConflictException("TypeCode là bắt buộc.");
        }

        var type = await _partnerVoucherRepository.GetTypeByCodeAsync(request.TypeCode.Trim(), cancellationToken)
            ?? throw new NotFoundException($"PartnerVoucherType '{request.TypeCode}' was not found.");

        var imported = 0;
        var duplicates = 0;
        var invalid = 0;
        var now = DateTime.UtcNow;
        var toAdd = new List<PartnerVoucherCode>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var raw in request.Codes ?? [])
        {
            var code = NormalizeCode(raw);
            if (string.IsNullOrEmpty(code) || !CodePattern.IsMatch(code))
            {
                invalid++;
                continue;
            }

            if (!seen.Add(code))
            {
                duplicates++;
                continue;
            }

            if (await _partnerVoucherRepository.ExistsCodeAsync(code, cancellationToken))
            {
                duplicates++;
                continue;
            }

            toAdd.Add(new PartnerVoucherCode
            {
                Id = Guid.NewGuid(),
                TypeId = type.Id,
                Code = code,
                Status = PartnerVoucherStatus.Available,
                ImportedByAdminId = adminUserId,
                ImportedAt = now,
                CreatedAt = now,
            });
            imported++;
        }

        if (toAdd.Count > 0)
        {
            await _partnerVoucherRepository.AddCodesAsync(toAdd, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var available = await _partnerVoucherRepository.GetAvailableCountsByTypeAsync(cancellationToken);
        return new ImportPartnerVoucherResultDto
        {
            Imported = imported,
            DuplicatesSkipped = duplicates,
            Invalid = invalid,
            RemainingAvailable = available.GetValueOrDefault(type.Code),
            TypeCode = type.Code,
        };
    }

    public async Task<AdminPartnerVoucherListResponse> AdminListAsync(
        string? status,
        string? typeCode,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var (items, total) = await _partnerVoucherRepository.ListAsync(
            status, typeCode, search, page, pageSize, cancellationToken);

        var userIds = items
            .Where(i => i.AssignedUserId.HasValue)
            .Select(i => i.AssignedUserId!.Value)
            .Distinct()
            .ToList();
        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var userMap = users.ToDictionary(u => u.Id);

        return new AdminPartnerVoucherListResponse
        {
            Items = items.Select(item =>
            {
                Models.UserAccount? user = null;
                if (item.AssignedUserId.HasValue)
                {
                    userMap.TryGetValue(item.AssignedUserId.Value, out user);
                }

                return MapAdminDto(item, user);
            }).ToList(),
            Stats = await GetInventoryStatsAsync(cancellationToken),
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
        };
    }

    public async Task<AdminPartnerVoucherListItemDto> ManualAssignAsync(
        AssignPartnerVoucherRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        if (!user.Role.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Chỉ cấp voucher FTES cho tài khoản Sinh viên.");
        }

        if (user.IsBanned)
        {
            throw new ConflictException("Tài khoản đang bị khóa — không thể cấp voucher.");
        }

        var type = await _partnerVoucherRepository.GetTypeByCodeAsync(request.TypeCode.Trim(), cancellationToken)
            ?? throw new NotFoundException($"PartnerVoucherType '{request.TypeCode}' was not found.");

        var code = await _partnerVoucherRepository.TryClaimAvailableAsync(type.Id, cancellationToken)
            ?? throw new ConflictException($"Kho mã {type.Label} đã hết. Hãy import thêm.");

        var now = DateTime.UtcNow;
        code.Status = PartnerVoucherStatus.Assigned;
        code.AssignedUserId = user.Id;
        code.AssignedAt = now;
        code.ExpiresAt = now.AddDays(type.ValidityDays);
        code.UpdatedAt = now;
        code.Type ??= type;

        await _partnerVoucherRepository.UpdateAsync(code, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.CreateAsync(
            user.Id,
            NotificationType.Token,
            $"Admin cấp {type.Label}",
            $"Mã FTES: {code.Code} (hết hạn {code.ExpiresAt:dd/MM/yyyy}).",
            "/home/premium",
            cancellationToken: cancellationToken);

        return MapAdminDto(code, user);
    }

    public async Task RevokeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var code = await _partnerVoucherRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("PartnerVoucherCode", id);

        if (code.Status is not (PartnerVoucherStatus.Available or PartnerVoucherStatus.Assigned))
        {
            throw new ConflictException("Chỉ thu hồi mã Available hoặc Assigned.");
        }

        code.Status = PartnerVoucherStatus.Revoked;
        code.UpdatedAt = DateTime.UtcNow;
        await _partnerVoucherRepository.UpdateAsync(code, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PartnerVoucherTypeDto>> ListTypesAsync(CancellationToken cancellationToken = default)
    {
        var types = await _partnerVoucherRepository.GetAllTypesAsync(cancellationToken);
        return types.Select(t => new PartnerVoucherTypeDto
        {
            Code = t.Code,
            Label = t.Label,
            DiscountPercent = t.DiscountPercent,
            ValidityDays = t.ValidityDays,
            PartnerName = t.PartnerName,
        }).ToList();
    }

    public async Task<AdminPartnerVoucherInventoryStatsDto> GetInventoryStatsAsync(
        CancellationToken cancellationToken = default)
    {
        var available = await _partnerVoucherRepository.GetAvailableCountsByTypeAsync(cancellationToken);
        var statusCounts = await _partnerVoucherRepository.GetStatusCountsAsync(cancellationToken);

        return new AdminPartnerVoucherInventoryStatsDto
        {
            AvailableFtes20 = available.GetValueOrDefault(PartnerVoucherTypeCodes.Ftes20),
            AvailableFtes100 = available.GetValueOrDefault(PartnerVoucherTypeCodes.Ftes100),
            AvailableTotal = available.Values.Sum(),
            Assigned = statusCounts.GetValueOrDefault("assigned"),
            Revoked = statusCounts.GetValueOrDefault("revoked"),
            Total = statusCounts.Values.Sum(),
        };
    }

    private static string NormalizeCode(string? raw) =>
        (raw ?? string.Empty).Trim();

    private static PartnerVoucherDto MapUserDto(PartnerVoucherCode code) =>
        new()
        {
            Id = code.Id,
            Code = code.Code,
            TypeCode = code.Type?.Code ?? string.Empty,
            TypeLabel = code.Type?.Label ?? string.Empty,
            DiscountPercent = code.Type?.DiscountPercent ?? 0,
            PartnerName = code.Type?.PartnerName ?? "FTES",
            Status = code.Status.ToString(),
            AssignedAt = code.AssignedAt,
            ExpiresAt = code.ExpiresAt,
        };

    private static AdminPartnerVoucherListItemDto MapAdminDto(PartnerVoucherCode code, Models.UserAccount? user) =>
        new()
        {
            Id = code.Id,
            Code = code.Code,
            TypeCode = code.Type?.Code ?? string.Empty,
            TypeLabel = code.Type?.Label ?? string.Empty,
            DiscountPercent = code.Type?.DiscountPercent ?? 0,
            Status = code.Status.ToString().ToLowerInvariant(),
            AssignedUserId = code.AssignedUserId,
            AssignedUsername = user?.Username,
            AssignedDisplayName = user?.DisplayName,
            PaymentOrderId = code.PaymentOrderId,
            ImportedAt = code.ImportedAt,
            AssignedAt = code.AssignedAt,
            ExpiresAt = code.ExpiresAt,
        };

    [GeneratedRegex(@"^[A-Za-z0-9][A-Za-z0-9\-_]{2,119}$", RegexOptions.Compiled)]
    private static partial Regex ValidCodeRegex();
}
