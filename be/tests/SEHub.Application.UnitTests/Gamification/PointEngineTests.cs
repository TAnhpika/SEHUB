using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Engines;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class PointEngineTests
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
    public async Task AwardByEventTypeAsync_WhenUserBanned_DoesNotApplyPoints()
    {
        _userRepository.Setup(r => r.IsCurrentlyBannedAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut();
        var result = await sut.AwardByEventTypeAsync(
            UserId,
            GamificationConstants.EventPostPublished,
            "post.published:1",
            "post",
            Guid.NewGuid());

        result.Applied.Should().BeFalse();
        result.Amount.Should().Be(0);
        _transactionRepository.Verify(
            r => r.AddAsync(It.IsAny<PointTransaction>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AwardByEventTypeAsync_WhenIdempotencyKeyExists_SkipsDuplicate()
    {
        _userRepository.Setup(r => r.IsCurrentlyBannedAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _transactionRepository.Setup(r => r.ExistsByIdempotencyKeyAsync("dup-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Application.Models.UserAccount { Id = UserId, Points = 42 });

        var sut = CreateSut();
        var result = await sut.AwardByEventTypeAsync(
            UserId,
            GamificationConstants.EventPostPublished,
            "dup-key",
            "post",
            Guid.NewGuid());

        result.Applied.Should().BeFalse();
        result.TotalPoints.Should().Be(42);
        _userRepository.Verify(
            r => r.ApplyPointDeltaAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AwardByEventTypeAsync_WhenRuleExists_AppliesPoints()
    {
        _userRepository.Setup(r => r.IsCurrentlyBannedAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _transactionRepository.Setup(r => r.ExistsByIdempotencyKeyAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _pointRuleRepository.Setup(r => r.GetActiveByEventTypeAsync(GamificationConstants.EventPostPublished, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PointRule>
            {
                new()
                {
                    Code = "post-published",
                    EventType = GamificationConstants.EventPostPublished,
                    Points = 10,
                    IsActive = true
                }
            });
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Application.Models.UserAccount { Id = UserId, Points = 110 });

        var sut = CreateSut();
        var result = await sut.AwardByEventTypeAsync(
            UserId,
            GamificationConstants.EventPostPublished,
            "post.published:new",
            "post",
            Guid.NewGuid());

        result.Applied.Should().BeTrue();
        result.Amount.Should().Be(10);
        result.TotalPoints.Should().Be(110);
        _userRepository.Verify(r => r.ApplyPointDeltaAsync(UserId, 10, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VoidByIdempotencyKeyAsync_WhenOriginalExists_ReversesPoints()
    {
        var sourceId = Guid.NewGuid();
        _transactionRepository.Setup(r => r.ExistsByIdempotencyKeyAsync("void-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _transactionRepository.Setup(r => r.GetByIdempotencyKeyAsync("original-key", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PointTransaction
            {
                UserId = UserId,
                RuleCode = "like-received",
                Amount = 2,
                IdempotencyKey = "original-key",
                SourceId = sourceId,
                Status = PointTransactionStatus.Posted
            });
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Application.Models.UserAccount { Id = UserId, Points = 98 });

        var sut = CreateSut();
        var result = await sut.VoidByIdempotencyKeyAsync(
            UserId,
            "original-key",
            "void-key",
            GamificationConstants.EventLikeRemoved);

        result.Applied.Should().BeTrue();
        result.Amount.Should().Be(-2);
        result.TotalPoints.Should().Be(98);
        _userRepository.Verify(r => r.ApplyPointDeltaAsync(UserId, -2, It.IsAny<CancellationToken>()), Times.Once);
        _transactionRepository.Verify(r => r.VoidByIdempotencyKeyAsync("original-key", It.IsAny<CancellationToken>()), Times.Once);
    }
}
