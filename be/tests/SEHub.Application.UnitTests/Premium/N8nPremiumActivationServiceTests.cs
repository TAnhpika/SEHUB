using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Application.Models;
using SEHub.Application.Premium;
using SEHub.Application.Premium.Validators;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Premium;

public sealed class N8nPremiumActivationServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<ISubscriptionPlanRepository> _planRepository = new();
    private readonly Mock<IPaymentOrderRepository> _orderRepository = new();
    private readonly Mock<IPaymentAuditLogRepository> _auditLogRepository = new();
    private readonly Mock<ISubscriptionService> _subscriptionService = new();
    private readonly Mock<IPaymentConfirmationNotifier> _paymentConfirmationNotifier = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid PlanId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public async Task ActivateAsync_WithValidRequest_ActivatesSubscriptionAndLogsAudit()
    {
        var user = CreateUser();
        var plan = CreatePlan();
        SetupUser(user);
        SetupPlan(plan);
        _orderRepository
            .Setup(r => r.GetByPayOsOrderCodeAsync("123456", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentOrder?)null);
        _subscriptionService
            .Setup(s => s.GetStatusAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SubscriptionStatusDto
            {
                IsActive = true,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                PlanName = plan.Name,
            });

        var sut = CreateSut();
        var result = await sut.ActivateAsync(new N8NPremiumActivationDto
        {
            OrderCode = "123456",
            Amount = 48000,
            PackageName = "Gói 1 tháng",
            Username = "demo.student",
        });

        result.IsPremium.Should().BeTrue();
        result.Username.Should().Be("demo.student");
        result.AiDailyTokenLimit.Should().Be(1000);
        _subscriptionService.Verify(
            s => s.ActivateSubscriptionAsync(UserId, PlanId, It.IsAny<CancellationToken>()),
            Times.Once);
        _auditLogRepository.Verify(
            r => r.AddAsync(It.Is<PaymentAuditLog>(l => l.Action == "N8N_ACTIVATE"), It.IsAny<CancellationToken>()),
            Times.Once);
        _paymentConfirmationNotifier.Verify(
            n => n.NotifyPaymentConfirmedAsync(It.IsAny<PaymentPaidNotification>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ActivateAsync_WhenOrderAlreadyPaid_IsIdempotent()
    {
        var user = CreateUser();
        var plan = CreatePlan();
        var paidOrder = new PaymentOrder
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            PlanId = PlanId,
            PayOsOrderCode = "123456",
            Amount = 48000,
            Status = PaymentOrderStatus.Paid,
            ExpiredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

        SetupUser(user);
        SetupPlan(plan);
        _orderRepository
            .Setup(r => r.GetByPayOsOrderCodeAsync("123456", It.IsAny<CancellationToken>()))
            .ReturnsAsync(paidOrder);
        _subscriptionService
            .Setup(s => s.GetStatusAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SubscriptionStatusDto
            {
                IsActive = true,
                ExpiresAt = DateTime.UtcNow.AddDays(10),
                PlanName = plan.Name,
            });

        var sut = CreateSut();
        var result = await sut.ActivateAsync(new N8NPremiumActivationDto
        {
            OrderCode = "123456",
            Amount = 48000,
            PackageName = "Gói 1 tháng",
            Username = "demo.student",
        });

        result.AlreadyProcessed.Should().BeTrue();
        _subscriptionService.Verify(
            s => s.ActivateSubscriptionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _auditLogRepository.Verify(
            r => r.AddAsync(It.IsAny<PaymentAuditLog>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _paymentConfirmationNotifier.Verify(
            n => n.NotifyPaymentConfirmedAsync(It.IsAny<PaymentPaidNotification>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private N8nPremiumActivationService CreateSut() => new(
        _userRepository.Object,
        _planRepository.Object,
        _orderRepository.Object,
        _auditLogRepository.Object,
        _subscriptionService.Object,
        _paymentConfirmationNotifier.Object,
        _unitOfWork.Object,
        new N8nPremiumActivationValidator(),
        Microsoft.Extensions.Options.Options.Create(new AiTokenLimitSettings
        {
            DailyTokenLimitFree = 10,
            DailyTokenLimitPremium = 1000,
        }));

    private void SetupUser(UserAccount user)
    {
        _userRepository
            .Setup(r => r.GetByUsernameAsync(user.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
    }

    private void SetupPlan(SubscriptionPlan plan)
    {
        _planRepository
            .Setup(r => r.GetByCodeAsync("1m", It.IsAny<CancellationToken>()))
            .ReturnsAsync(plan);
    }

    private static UserAccount CreateUser() => new()
    {
        Id = UserId,
        Username = "demo.student",
        Email = "demo.student@sehub.local",
        DisplayName = "Demo Student",
        Role = "Student",
    };

    private static SubscriptionPlan CreatePlan() => new()
    {
        Id = PlanId,
        Code = "1m",
        Name = "1 Month",
        DurationDays = 30,
        PriceVnd = 48000,
    };
}
