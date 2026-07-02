using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Gamification.Engines;

public sealed class RewardEngine : IRewardEngine
{
    private readonly IRewardRuleRepository _rewardRuleRepository;
    private readonly IRankRewardVoucherRepository _voucherRepository;
    private readonly ILevelConfigRepository _levelRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _unitOfWork;

    public RewardEngine(
        IRewardRuleRepository rewardRuleRepository,
        IRankRewardVoucherRepository voucherRepository,
        ILevelConfigRepository levelRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IUnitOfWork unitOfWork)
    {
        _rewardRuleRepository = rewardRuleRepository;
        _voucherRepository = voucherRepository;
        _levelRepository = levelRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _unitOfWork = unitOfWork;
    }

    public async Task GrantLevelRewardsAsync(Guid userId, Guid newLevelId, CancellationToken cancellationToken = default)
    {
        var rule = await _rewardRuleRepository.GetByLevelIdAsync(newLevelId, cancellationToken);
        if (rule is null || !rule.IsActive)
        {
            return;
        }

        if (rule.OneTimeOnly && await _voucherRepository.ExistsForUserAndLevelAsync(userId, newLevelId, cancellationToken))
        {
            return;
        }

        var level = await _levelRepository.GetByIdAsync(newLevelId, cancellationToken);
        var now = DateTime.UtcNow;
        await _voucherRepository.AddAsync(new RankRewardVoucher
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            LevelId = newLevelId,
            DiscountPercent = rule.DiscountPercent,
            Status = VoucherStatus.Active,
            GrantedAt = now,
            ExpiresAt = now.AddDays(rule.ExpiryDays),
            CreatedAt = now
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        await _notificationService.CreateAsync(
            userId,
            NotificationType.Token,
            $"Thưởng hạng {level?.Name ?? "mới"}!",
            $"Bạn nhận Voucher FTES {rule.DiscountPercent}% (hết hạn sau {rule.ExpiryDays} ngày).",
            user is null ? null : $"/home/premium",
            cancellationToken: cancellationToken);
    }
}
