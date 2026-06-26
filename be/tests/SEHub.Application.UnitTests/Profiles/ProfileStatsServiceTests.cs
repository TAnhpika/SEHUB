using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Application.Models;
using SEHub.Application.Profiles;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Profiles;

public sealed class ProfileStatsServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserBadgeRepository> _badgeRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<ICommentRepository> _commentRepository = new();
    private readonly Mock<IExamAttemptRepository> _examAttemptRepository = new();
    private readonly Mock<IGamificationReadService> _gamificationReadService = new();
    private readonly Mock<IProfileSnapshotCache> _snapshotCache = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public ProfileStatsServiceTests()
    {
        _snapshotCache
            .Setup(c => c.GetAsync<ProfileStatsDto>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ProfileStatsDto?)null);
    }

    private ProfileStatsService CreateSut() => new(
        _userRepository.Object,
        _badgeRepository.Object,
        _postRepository.Object,
        _commentRepository.Object,
        _examAttemptRepository.Object,
        _gamificationReadService.Object,
        _snapshotCache.Object,
        _currentUser.Object);

    [Fact]
    public async Task GetByUsernameAsync_ReturnsAggregatedStats()
    {
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(true);
        _userRepository.Setup(r => r.GetByUsernameAsync("anhpika", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Username = "anhpika", DisplayName = "Anhpika" });
        _gamificationReadService.Setup(g => g.GetProfileGamificationAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GamificationProfileDto
            {
                Points = 120,
                LevelName = "Bronze",
                CurrentStreak = 3,
                HighestStreak = 5,
                NextLevelPoints = 200,
                NextLevelName = "Silver",
                ProgressPercent = 60m,
                RemainingPoints = 80
            });
        _badgeRepository.Setup(r => r.CountByUserIdAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(2);
        _postRepository.Setup(r => r.CountByAuthorIdAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(5);
        _commentRepository.Setup(r => r.CountByAuthorIdAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(7);
        _examAttemptRepository.Setup(r => r.CountSubmittedByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(4);

        var sut = CreateSut();
        var result = await sut.GetByUsernameAsync("anhpika");

        result.Points.Should().Be(120);
        result.LevelName.Should().Be("Bronze");
        result.StreakCount.Should().Be(3);
        result.HighestStreak.Should().Be(5);
        result.ProgressPercent.Should().Be(60m);
        result.RemainingPoints.Should().Be(80);
        result.NextLevelPoints.Should().Be(200);
        result.NextLevelName.Should().Be("Silver");
        result.BadgesCount.Should().Be(2);
        result.PostsCount.Should().Be(5);
        result.CommentsCount.Should().Be(7);
        result.ExamsCompleted.Should().Be(4);
    }

    [Fact]
    public async Task GetByUsernameAsync_WhenUserMissing_ThrowsNotFound()
    {
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(true);
        _userRepository.Setup(r => r.GetByUsernameAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserAccount?)null);

        var sut = CreateSut();
        var act = () => sut.GetByUsernameAsync("missing");

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetMyStatsAsync_WhenUnauthenticated_ThrowsForbidden()
    {
        _currentUser.SetupGet(u => u.UserId).Returns((Guid?)null);

        var sut = CreateSut();
        var act = () => sut.GetMyStatsAsync();

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetByUsernameAsync_WhenCached_SkipsRepositoryAggregation()
    {
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(true);
        _userRepository.Setup(r => r.GetByUsernameAsync("anhpika", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Username = "anhpika", DisplayName = "Anhpika" });
        _snapshotCache
            .Setup(c => c.GetAsync<ProfileStatsDto>(
                $"profile:stats:{UserId}",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProfileStatsDto
            {
                Points = 99,
                LevelName = "Silver",
                StreakCount = 1,
                PostsCount = 1,
            });

        var sut = CreateSut();
        var result = await sut.GetByUsernameAsync("anhpika");

        result.Points.Should().Be(99);
        result.LevelName.Should().Be("Silver");
        _gamificationReadService.Verify(
            g => g.GetProfileGamificationAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
