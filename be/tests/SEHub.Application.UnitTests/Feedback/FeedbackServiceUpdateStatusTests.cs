using FluentAssertions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feedback;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Application.Notifications;
using SEHub.Contracts.Feedback;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Feedback;

public sealed class FeedbackServiceUpdateStatusTests
{
    private static readonly Guid FeedbackId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid UserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ActorId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private readonly Mock<IUserFeedbackRepository> _feedbackRepository = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<IPointEngine> _pointEngine = new();
    private readonly Mock<ILevelEngine> _levelEngine = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IFileStorageService> _fileStorage = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private FeedbackService CreateSut() => new(
        _feedbackRepository.Object,
        _workflowNotifications.Object,
        _pointEngine.Object,
        _levelEngine.Object,
        _currentUser.Object,
        _fileStorage.Object,
        _unitOfWork.Object);

    private UserFeedback CreateFeedback(FeedbackStatus status) => new()
    {
        Id = FeedbackId,
        UserId = UserId,
        Username = "demo_student",
        Description = "Bug report",
        Status = status,
        CreatedAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task UpdateStatusAsync_ToResolved_AwardsPointsAndNotifiesUser()
    {
        var feedback = CreateFeedback(FeedbackStatus.Pending);
        _currentUser.SetupGet(u => u.UserId).Returns(ActorId);
        _feedbackRepository.Setup(r => r.GetByIdAsync(FeedbackId, It.IsAny<CancellationToken>())).ReturnsAsync(feedback);
        _pointEngine
            .Setup(p => p.AwardByEventTypeAsync(
                UserId,
                GamificationConstants.EventFeedbackResolved,
                $"feedback.resolved:{FeedbackId}",
                "feedback",
                FeedbackId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PointAwardResult { Applied = true, Amount = 50, TotalPoints = 50 });

        var sut = CreateSut();
        var result = await sut.UpdateStatusAsync(FeedbackId, new UpdateFeedbackStatusRequest { Status = "Resolved" });

        result.Status.Should().Be("Resolved");
        feedback.Status.Should().Be(FeedbackStatus.Resolved);
        _pointEngine.Verify(
            p => p.AwardByEventTypeAsync(
                UserId,
                GamificationConstants.EventFeedbackResolved,
                $"feedback.resolved:{FeedbackId}",
                "feedback",
                FeedbackId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        _levelEngine.Verify(l => l.RecalculateAsync(UserId, It.IsAny<CancellationToken>()), Times.Once);
        _workflowNotifications.Verify(
            n => n.NotifyUserFeedbackResolvedAsync(UserId, FeedbackId, ActorId, It.IsAny<CancellationToken>()),
            Times.Once);
        _workflowNotifications.Verify(
            n => n.NotifyUserFeedbackRejectedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_ResolvedAgain_DoesNotAwardOrNotifyAgain()
    {
        var feedback = CreateFeedback(FeedbackStatus.Resolved);
        _currentUser.SetupGet(u => u.UserId).Returns(ActorId);
        _feedbackRepository.Setup(r => r.GetByIdAsync(FeedbackId, It.IsAny<CancellationToken>())).ReturnsAsync(feedback);

        var sut = CreateSut();
        await sut.UpdateStatusAsync(FeedbackId, new UpdateFeedbackStatusRequest { Status = "Resolved" });

        _pointEngine.Verify(
            p => p.AwardByEventTypeAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        _workflowNotifications.Verify(
            n => n.NotifyUserFeedbackResolvedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_ToRejected_NotifiesWithoutPoints()
    {
        var feedback = CreateFeedback(FeedbackStatus.Reviewed);
        _currentUser.SetupGet(u => u.UserId).Returns(ActorId);
        _feedbackRepository.Setup(r => r.GetByIdAsync(FeedbackId, It.IsAny<CancellationToken>())).ReturnsAsync(feedback);

        var sut = CreateSut();
        var result = await sut.UpdateStatusAsync(FeedbackId, new UpdateFeedbackStatusRequest { Status = "Rejected" });

        result.Status.Should().Be("Rejected");
        _pointEngine.Verify(
            p => p.AwardByEventTypeAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        _workflowNotifications.Verify(
            n => n.NotifyUserFeedbackRejectedAsync(UserId, FeedbackId, ActorId, It.IsAny<CancellationToken>()),
            Times.Once);
        _workflowNotifications.Verify(
            n => n.NotifyUserFeedbackResolvedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
