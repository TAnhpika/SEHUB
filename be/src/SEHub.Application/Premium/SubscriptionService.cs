using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;

namespace SEHub.Application.Premium;

public sealed class SubscriptionService : ISubscriptionService
{
    private readonly ISubscriptionRepository _subscriptionRepository;
    private readonly ISubscriptionPlanRepository _planRepository;
    private readonly IPremiumStatusService _premiumStatusService;
    private readonly IUnitOfWork _unitOfWork;

    public SubscriptionService(
        ISubscriptionRepository subscriptionRepository,
        ISubscriptionPlanRepository planRepository,
        IPremiumStatusService premiumStatusService,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _planRepository = planRepository;
        _premiumStatusService = premiumStatusService;
        _unitOfWork = unitOfWork;
    }

    public async Task<SubscriptionStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);
        if (subscription is null || !subscription.IsActive || subscription.EndAt <= DateTime.UtcNow)
        {
            return new SubscriptionStatusDto { IsActive = false };
        }

        return new SubscriptionStatusDto
        {
            IsActive = true,
            ExpiresAt = subscription.EndAt,
            PlanName = subscription.Plan?.Name
        };
    }

    public async Task ActivateSubscriptionAsync(Guid userId, Guid planId, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(planId, cancellationToken)
            ?? throw new InvalidOperationException("Plan not found.");

        var now = DateTime.UtcNow;
        var existing = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);
        var extendFromExisting = existing is not null && existing.IsActive && existing.EndAt > now;
        var subscriptionStart = extendFromExisting ? existing!.StartAt : now;
        var baseDate = extendFromExisting ? existing!.EndAt : now;

        await _subscriptionRepository.DeactivateAllForUserAsync(userId, cancellationToken);

        await _subscriptionRepository.AddAsync(new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanId = planId,
            StartAt = subscriptionStart,
            EndAt = baseDate.AddDays(plan.DurationDays),
            IsActive = true,
            CreatedAt = now
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _premiumStatusService.InvalidateCache(userId);
    }

    public async Task<bool> RevokePlanDurationForRefundAsync(
        Guid userId,
        int durationDays,
        CancellationToken cancellationToken = default)
    {
        if (durationDays <= 0)
        {
            return (await GetStatusAsync(userId, cancellationToken)).IsActive;
        }

        var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);
        if (subscription is null)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        var newEndAt = subscription.EndAt.AddDays(-durationDays);

        if (newEndAt <= now)
        {
            subscription.IsActive = false;
            subscription.EndAt = newEndAt;
        }
        else
        {
            subscription.EndAt = newEndAt;
            subscription.IsActive = true;
        }

        subscription.UpdatedAt = now;
        await _subscriptionRepository.UpdateAsync(subscription, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _premiumStatusService.InvalidateCache(userId);

        return subscription.IsActive && subscription.EndAt > now;
    }
}
