using FluentAssertions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Profiles;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Profiles;

public sealed class ProfileActivityServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserDailyActivityRepository> _activityRepository = new();
    private readonly Mock<IProfileActivityCache> _activityCache = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private ProfileActivityService CreateSut() => new(
        _userRepository.Object,
        _activityRepository.Object,
        _activityCache.Object,
        _currentUser.Object);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(2, 1)]
    [InlineData(3, 2)]
    [InlineData(5, 2)]
    [InlineData(6, 3)]
    [InlineData(9, 3)]
    [InlineData(10, 4)]
    public void ToHeatmapLevel_MapsCounts(int count, int expectedLevel)
    {
        ProfileActivityService.ToHeatmapLevel(count).Should().Be(expectedLevel);
    }

    [Fact]
    public async Task GetByUsernameAsync_WhenGuest_ThrowsForbidden()
    {
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(false);

        var sut = CreateSut();
        var act = () => sut.GetByUsernameAsync("demo");

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetByUsernameAsync_ReturnsAggregatedDays()
    {
        _currentUser.SetupGet(u => u.IsAuthenticated).Returns(true);
        _userRepository
            .Setup(r => r.GetByUsernameAsync("demo", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = UserId, Username = "demo" });
        _activityCache
            .Setup(c => c.GetAsync<ProfileActivityDto>(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ProfileActivityDto?)null);
        _activityRepository
            .Setup(r => r.GetRangeAsync(UserId, It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserDailyActivity>
            {
                new() { UserId = UserId, ActivityDate = DateOnly.FromDateTime(DateTime.UtcNow), ActivityCount = 3 },
            });

        var sut = CreateSut();
        var result = await sut.GetByUsernameAsync("demo", months: 1);

        result.TotalActivities.Should().BeGreaterThan(0);
        result.Days.Should().NotBeEmpty();
        result.Days.Last().Count.Should().Be(3);
        result.Days.Last().Level.Should().Be(2);
    }
}
