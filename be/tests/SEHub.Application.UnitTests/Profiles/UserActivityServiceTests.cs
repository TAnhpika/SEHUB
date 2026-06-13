using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Profiles;

public sealed class UserActivityServiceTests
{
    private readonly Mock<IUserDailyActivityRepository> _activityRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<INotificationService> _notificationService = new();
    private readonly Mock<IProfileActivityCache> _activityCache = new();
    private readonly Mock<IProfileSnapshotCache> _snapshotCache = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<Microsoft.Extensions.Logging.ILogger<UserActivityService>> _logger = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private UserActivityService CreateSut() => new(
        _activityRepository.Object,
        _userRepository.Object,
        _notificationService.Object,
        _activityCache.Object,
        _snapshotCache.Object,
        _unitOfWork.Object,
        _logger.Object);

    [Fact]
    public async Task RecordActivityAsync_OnStreakMilestone_AwardsPointsAndNotification()
    {
        _userRepository
            .Setup(r => r.UpdateStreakOnActivityAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StreakUpdateResult(true, 7));
        _userRepository
            .Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Username = "demo" });

        var sut = CreateSut();
        await sut.RecordActivityAsync(UserId);

        _userRepository.Verify(
            r => r.AddPointsAsync(UserId, UserActivityService.StreakMilestonePoints, It.IsAny<CancellationToken>()),
            Times.Once);
        _notificationService.Verify(
            n => n.CreateAsync(
                UserId,
                NotificationType.Token,
                It.IsAny<string>(),
                It.IsAny<string>(),
                "/profile/demo",
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
        _activityCache.Verify(c => c.InvalidateUser(UserId), Times.Once);
        _snapshotCache.Verify(c => c.InvalidateStats(UserId), Times.Once);
    }

    [Fact]
    public async Task RecordActivityAsync_WhenStreakNotIncremented_DoesNotAwardPoints()
    {
        _userRepository
            .Setup(r => r.UpdateStreakOnActivityAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StreakUpdateResult(false, 3));

        var sut = CreateSut();
        await sut.RecordActivityAsync(UserId);

        _userRepository.Verify(
            r => r.AddPointsAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
