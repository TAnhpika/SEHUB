using Moq;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Notifications;

public sealed class WorkflowNotificationServiceTests
{
    private readonly Mock<INotificationService> _notificationService = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserSearchRepository> _searchRepository = new();

    private WorkflowNotificationService CreateSut() => new(
        _notificationService.Object,
        _userRepository.Object,
        _searchRepository.Object);

    [Fact]
    public async Task EnsureModeratorWelcomeNotificationAsync_WhenPending_CreatesNotificationAndClearsPending()
    {
        var userId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        _userRepository
            .Setup(r => r.GetModeratorWelcomePendingAtAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        _userRepository
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount
            {
                Id = userId,
                Username = "new_mod",
                Role = RoleNames.Moderator,
            });

        var sut = CreateSut();
        await sut.EnsureModeratorWelcomeNotificationAsync(userId);

        _notificationService.Verify(
            s => s.CreateAsync(
                userId,
                NotificationType.ModeratorWelcome,
                It.IsAny<string>(),
                It.IsAny<string>(),
                "/moderator/reports",
                null,
                userId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        _userRepository.Verify(r => r.ClearModeratorWelcomePendingAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NotifyModeratorExamReviewResultAsync_WhenRejected_LinksToPracticeEdit()
    {
        var moderatorId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var examId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var exam = new Exam
        {
            Id = examId,
            PaperCode = "PRF192-LAB",
            SubjectCode = "PRF192",
            ExamType = ExamType.Practice,
            SubmittedById = moderatorId,
        };

        var sut = CreateSut();
        await sut.NotifyModeratorExamReviewResultAsync(exam, approved: false, actorUserId: Guid.NewGuid());

        _notificationService.Verify(
            s => s.CreateAsync(
                moderatorId,
                NotificationType.ExamReview,
                It.IsAny<string>(),
                It.IsAny<string>(),
                $"/moderator/practice-exams/edit/{examId}",
                It.IsAny<Guid?>(),
                examId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
