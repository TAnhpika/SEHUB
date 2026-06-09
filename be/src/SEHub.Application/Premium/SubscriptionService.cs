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

        await _subscriptionRepository.DeactivateAllForUserAsync(userId, cancellationToken);

        var now = DateTime.UtcNow;
        await _subscriptionRepository.AddAsync(new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanId = planId,
            StartAt = now,
            EndAt = now.AddDays(plan.DurationDays),
            IsActive = true,
            CreatedAt = now
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _premiumStatusService.InvalidateCache(userId);
    }
}
