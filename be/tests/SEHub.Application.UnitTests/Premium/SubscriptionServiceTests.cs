using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Premium;
using SEHub.Domain.Entities;

namespace SEHub.Application.UnitTests.Premium;

public sealed class SubscriptionServiceTests
{
    private readonly Mock<ISubscriptionRepository> _subscriptionRepository = new();
    private readonly Mock<ISubscriptionPlanRepository> _planRepository = new();
    private readonly Mock<IPremiumStatusService> _premiumStatusService = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid PlanId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private SubscriptionService CreateSut() => new(
        _subscriptionRepository.Object,
        _planRepository.Object,
        _premiumStatusService.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task ActivateSubscriptionAsync_DeactivatesExistingAndCreatesActiveSubscription()
    {
        var plan = new SubscriptionPlan
        {
            Id = PlanId,
            Code = "1m",
            Name = "1 Month",
            DurationDays = 30,
            PriceVnd = 48000
        };

        _planRepository
            .Setup(r => r.GetByIdAsync(PlanId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(plan);

        Subscription? addedSubscription = null;
        _subscriptionRepository
            .Setup(r => r.AddAsync(It.IsAny<Subscription>(), It.IsAny<CancellationToken>()))
            .Callback<Subscription, CancellationToken>((subscription, _) => addedSubscription = subscription)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.ActivateSubscriptionAsync(UserId, PlanId);

        _subscriptionRepository.Verify(
            r => r.DeactivateAllForUserAsync(UserId, It.IsAny<CancellationToken>()),
            Times.Once);
        _subscriptionRepository.Verify(
            r => r.AddAsync(It.IsAny<Subscription>(), It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);

        addedSubscription.Should().NotBeNull();
        addedSubscription!.UserId.Should().Be(UserId);
        addedSubscription.PlanId.Should().Be(PlanId);
        addedSubscription.IsActive.Should().BeTrue();
        addedSubscription.EndAt.Should().BeCloseTo(
            addedSubscription.StartAt.AddDays(plan.DurationDays),
            TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task ActivateSubscriptionAsync_ExtendsFromExistingEndAt_WhenAlreadyActive()
    {
        var plan = new SubscriptionPlan
        {
            Id = PlanId,
            Code = "1m",
            Name = "1 Month",
            DurationDays = 30,
            PriceVnd = 48000
        };

        var existingEnd = DateTime.UtcNow.AddDays(10);
        var existing = new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            PlanId = PlanId,
            StartAt = DateTime.UtcNow.AddDays(-20),
            EndAt = existingEnd,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };

        _planRepository
            .Setup(r => r.GetByIdAsync(PlanId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(plan);

        _subscriptionRepository
            .Setup(r => r.GetActiveByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        Subscription? addedSubscription = null;
        _subscriptionRepository
            .Setup(r => r.AddAsync(It.IsAny<Subscription>(), It.IsAny<CancellationToken>()))
            .Callback<Subscription, CancellationToken>((subscription, _) => addedSubscription = subscription)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.ActivateSubscriptionAsync(UserId, PlanId);

        addedSubscription.Should().NotBeNull();
        addedSubscription!.StartAt.Should().BeCloseTo(existing.StartAt, TimeSpan.FromSeconds(1));
        addedSubscription.EndAt.Should().BeCloseTo(
            existingEnd.AddDays(plan.DurationDays),
            TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetStatusAsync_WhenNoActiveSubscription_ReturnsInactive()
    {
        _subscriptionRepository
            .Setup(r => r.GetActiveByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Subscription?)null);

        var sut = CreateSut();
        var status = await sut.GetStatusAsync(UserId);

        status.IsActive.Should().BeFalse();
    }
}
