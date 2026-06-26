using Microsoft.Extensions.Caching.Memory;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Admin;
using SEHub.Application.Feed;
using SEHub.Application.Gamification;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Application.Models;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Admin;

public sealed class ModerationServiceTests
{
    private readonly Mock<IPostReportRepository> _reportRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserProfileRepository> _profileRepository = new();
    private readonly Mock<IUserBanRepository> _banRepository = new();
    private readonly Mock<IPracticeSubmissionRepository> _submissionRepository = new();
    private readonly Mock<IExamRepository> _examRepository = new();
    private readonly Mock<IGamificationService> _gamificationService = new();
    private readonly Mock<IBadgeCheckService> _badgeCheckService = new();
    private readonly Mock<IUserActivityService> _userActivityService = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private readonly ModerationService _service;
    private readonly Guid _moderatorId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private readonly Guid _postId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    public ModerationServiceTests()
    {
        _currentUser.SetupGet(u => u.UserId).Returns(_moderatorId);
        _currentUser.SetupGet(u => u.Role).Returns("Moderator");

        _service = new ModerationService(
            _reportRepository.Object,
            _postRepository.Object,
            _userRepository.Object,
            _profileRepository.Object,
            _banRepository.Object,
            _submissionRepository.Object,
            _examRepository.Object,
            _gamificationService.Object,
            _badgeCheckService.Object,
            _userActivityService.Object,
            _workflowNotifications.Object,
            _currentUser.Object,
            _unitOfWork.Object,
            new MemoryCache(new MemoryCacheOptions()));
    }

    [Fact]
    public async Task ModeratePostAsync_Approve_PublishesAndAwardsPoints()
    {
        var post = new Post
        {
            Id = _postId,
            AuthorId = Guid.NewGuid(),
            Title = "Pending",
            Content = "Content",
            Status = PostStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _postRepository.Setup(r => r.GetByIdAsync(_postId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _userRepository.Setup(r => r.GetByIdAsync(post.AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount
            {
                Id = post.AuthorId,
                Username = "student",
                DisplayName = "Student",
                Email = "student@test.local"
            });
        _profileRepository.Setup(r => r.GetByUserIdAsync(post.AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfile { Major = "SE", Semester = 1 });

        var result = await _service.ModeratePostAsync(
            _postId,
            new ModeratePostRequest { Action = "approve", Note = "Looks good." },
            CancellationToken.None);

        post.Status.Should().Be(PostStatus.Published);
        result.Status.Should().Be(nameof(PostStatus.Published));
        _gamificationService.Verify(
            g => g.AwardPostPublishedAsync(post.AuthorId, post.Id, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ModeratePostAsync_RejectWithoutNote_Throws()
    {
        var post = new Post
        {
            Id = _postId,
            AuthorId = Guid.NewGuid(),
            Title = "Pending",
            Content = "Content",
            Status = PostStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _postRepository.Setup(r => r.GetByIdAsync(_postId, It.IsAny<CancellationToken>())).ReturnsAsync(post);

        var act = () => _service.ModeratePostAsync(
            _postId,
            new ModeratePostRequest { Action = "reject" },
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task BanUserAsync_WithInvalidDuration_ThrowsForModerator()
    {
        var userId = Guid.NewGuid();
        _userRepository.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount
            {
                Id = userId,
                Username = "bad",
                DisplayName = "Bad",
                Email = "bad@test.local",
                Role = RoleNames.Student
            });

        var act = () => _service.BanUserAsync(
            userId,
            new ModeratorBanUserRequest { DurationDays = 14, Reason = "Spam" },
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task WarnUserAsync_WithoutReason_UsesDefaultReason()
    {
        var userId = Guid.NewGuid();
        _userRepository.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount
            {
                Id = userId,
                Username = "student",
                DisplayName = "Student",
                Email = "student@test.local",
                Role = RoleNames.Student
            });
        _banRepository.Setup(r => r.CountByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _banRepository.Setup(r => r.CountByUserIdAndTypeAsync(userId, BanType.Warning, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _banRepository.Setup(r => r.GetLatestByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserBan
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActorId = _moderatorId,
                BanType = BanType.Warning,
                Reason = "Vi phạm quy định cộng đồng SEHUB.",
                CreatedAt = DateTime.UtcNow
            });
        _profileRepository.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserProfile { Major = "SE", Semester = 1 });

        await _service.WarnUserAsync(userId, new ModeratorWarnUserRequest { Reason = "" }, CancellationToken.None);

        _banRepository.Verify(
            r => r.AddAsync(It.Is<UserBan>(b => b.Reason.Contains("SEHUB")), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
