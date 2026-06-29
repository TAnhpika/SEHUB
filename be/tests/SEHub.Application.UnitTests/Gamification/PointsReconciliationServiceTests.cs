using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification;
using SEHub.Application.Models;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class PointsReconciliationServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IPointTransactionRepository> _transactionRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private PointsReconciliationService CreateSut() => new(
        _userRepository.Object,
        _transactionRepository.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task ReconcileUserAsync_Fixes_drift_when_applyFix_true()
    {
        _userRepository
            .Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Points = 120 });

        _transactionRepository
            .Setup(r => r.SumPostedPointsAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(80);

        var sut = CreateSut();
        var result = await sut.ReconcileUserAsync(UserId, applyFix: true);

        Assert.Equal(40, result.Drift);
        Assert.True(result.Fixed);
        _userRepository.Verify(r => r.ApplyPointDeltaAsync(UserId, -40, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
