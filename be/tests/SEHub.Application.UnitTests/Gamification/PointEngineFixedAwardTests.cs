using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Engines;
using SEHub.Domain.Entities;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class PointEngineFixedAwardTests
{
    private readonly Mock<IPointRuleRepository> _pointRuleRepository = new();
    private readonly Mock<IPointTransactionRepository> _transactionRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private PointEngine CreateSut() => new(
        _pointRuleRepository.Object,
        _transactionRepository.Object,
        _userRepository.Object,
        _unitOfWork.Object,
        NullLogger<PointEngine>.Instance);

    [Fact]
    public async Task AwardFixedPointsAsync_WhenAmountPositive_AppliesPoints()
    {
        _userRepository.Setup(r => r.IsCurrentlyBannedAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _transactionRepository.Setup(r => r.ExistsByIdempotencyKeyAsync("mission-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Application.Models.UserAccount { Id = UserId, Points = 50 });

        var sut = CreateSut();
        var result = await sut.AwardFixedPointsAsync(
            UserId,
            15,
            "mission-daily-daily-comment",
            "mission-key",
            "daily_mission",
            Guid.NewGuid());

        result.Applied.Should().BeTrue();
        result.Amount.Should().Be(15);
        result.RuleCode.Should().Be("mission-daily-daily-comment");
        _userRepository.Verify(r => r.ApplyPointDeltaAsync(UserId, 15, It.IsAny<CancellationToken>()), Times.Once);
        _transactionRepository.Verify(
            r => r.AddAsync(
                It.Is<PointTransaction>(t =>
                    t.Amount == 15
                    && t.RuleCode == "mission-daily-daily-comment"
                    && t.SourceType == "daily_mission"
                    && t.IdempotencyKey == "mission-key"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AwardFixedPointsAsync_WhenAmountNotPositive_DoesNotApply()
    {
        var sut = CreateSut();
        var result = await sut.AwardFixedPointsAsync(
            UserId,
            0,
            "mission-daily-x",
            "key",
            "daily_mission",
            null);

        result.Applied.Should().BeFalse();
        _transactionRepository.Verify(
            r => r.AddAsync(It.IsAny<PointTransaction>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AwardFixedPointsAsync_WhenIdempotencyExists_SkipsDuplicate()
    {
        _userRepository.Setup(r => r.IsCurrentlyBannedAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _transactionRepository.Setup(r => r.ExistsByIdempotencyKeyAsync("dup", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Application.Models.UserAccount { Id = UserId, Points = 99 });

        var sut = CreateSut();
        var result = await sut.AwardFixedPointsAsync(
            UserId,
            8,
            "mission-daily-x",
            "dup",
            "daily_mission",
            null);

        result.Applied.Should().BeFalse();
        result.TotalPoints.Should().Be(99);
        _userRepository.Verify(
            r => r.ApplyPointDeltaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
