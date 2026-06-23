using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class BadgeCheckServiceTests
{
    private readonly Mock<IBadgeRepository> _badgeRepository = new();
    private readonly Mock<IUserBadgeRepository> _userBadgeRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<ICommentRepository> _commentRepository = new();
    private readonly Mock<IExamAttemptRepository> _examAttemptRepository = new();
    private readonly Mock<IPracticeSubmissionRepository> _practiceSubmissionRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<INotificationService> _notificationService = new();
    private readonly Mock<IProfileSnapshotCache> _snapshotCache = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid BadgeId = Guid.Parse("b1000001-0000-0000-0000-000000000001");

    private BadgeCheckService CreateSut() => new(
        _badgeRepository.Object,
        _userBadgeRepository.Object,
        _postRepository.Object,
        _commentRepository.Object,
        _examAttemptRepository.Object,
        _practiceSubmissionRepository.Object,
        _userRepository.Object,
        _notificationService.Object,
        _snapshotCache.Object,
        _unitOfWork.Object,
        NullLogger<BadgeCheckService>.Instance);

    [Fact]
    public async Task EvaluateForTriggerAsync_WhenThresholdMet_GrantsBadgeAndNotifies()
    {
        var badge = new Badge
        {
            Id = BadgeId,
            Code = "first-blogger",
            Name = "First Blogger",
            ConditionJson = "{\"triggerType\":\"posts_published\",\"triggerValue\":1,\"description\":\"Viết bài blog đầu tiên\"}"
        };

        _badgeRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([badge]);
        _userBadgeRepository.Setup(r => r.ExistsAsync(UserId, BadgeId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _postRepository.Setup(r => r.CountByAuthorIdAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _userBadgeRepository.Setup(r => r.TryGrantAsync(UserId, BadgeId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Username = "anhpika", DisplayName = "Anhpika" });

        var sut = CreateSut();
        await sut.EvaluateForTriggerAsync(UserId, BadgeCheckService.TriggerPostsPublished);

        _userBadgeRepository.Verify(r => r.TryGrantAsync(UserId, BadgeId, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _notificationService.Verify(
            n => n.CreateAsync(
                UserId,
                NotificationType.Badge,
                It.Is<string>(title => title.Contains("First Blogger")),
                It.IsAny<string?>(),
                "/profile/anhpika",
                null,
                BadgeId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EvaluateForTriggerAsync_WhenAlreadyEarned_DoesNotGrantAgain()
    {
        var badge = new Badge
        {
            Id = BadgeId,
            Code = "first-blogger",
            Name = "First Blogger",
            ConditionJson = "{\"triggerType\":\"posts_published\",\"triggerValue\":1,\"description\":\"Viết bài blog đầu tiên\"}"
        };

        _badgeRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync([badge]);
        _userBadgeRepository.Setup(r => r.ExistsAsync(UserId, BadgeId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = CreateSut();
        await sut.EvaluateForTriggerAsync(UserId, BadgeCheckService.TriggerPostsPublished);

        _userBadgeRepository.Verify(r => r.TryGrantAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
