using FluentAssertions;
using Moq;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Engines;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class GamificationReadServiceDailyMissionTests
{
    private readonly Mock<ILevelEngine> _levelEngine = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IMissionRepository> _missionRepository = new();
    private readonly Mock<IUserMissionProgressRepository> _missionProgressRepository = new();

    private static readonly Guid UserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid MissionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private GamificationReadService CreateSut() => new(
        _levelEngine.Object,
        _userRepository.Object,
        _missionRepository.Object,
        _missionProgressRepository.Object);

    [Fact]
    public async Task GetDailyMissionProgressAsync_ReadsProgressFromUserMissionProgress()
    {
        var periodKey = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var mission = (MissionId, "daily-read", "Đọc tài liệu", GamificationConstants.EventDocumentRead, 2, 5);

        _missionRepository.Setup(r => r.GetActiveDailyMissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, string, int, int)> { mission });

        _missionProgressRepository.Setup(r => r.GetAsync(
                UserId,
                "daily-read",
                periodKey,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserMissionProgress
            {
                UserId = UserId,
                MissionCode = "daily-read",
                PeriodKey = periodKey,
                ProgressCount = 1,
                CompletedAt = null
            });

        var sut = CreateSut();
        var result = await sut.GetDailyMissionProgressAsync(UserId);

        result.Should().ContainSingle();
        var dto = result[0];
        dto.Code.Should().Be("daily-read");
        dto.Current.Should().Be(1);
        dto.Target.Should().Be(2);
        dto.RewardPoints.Should().Be(5);
        dto.IsCompleted.Should().BeFalse();
        dto.Title.Should().Be("Đọc tài liệu");
    }

    [Fact]
    public async Task GetDailyMissionProgressAsync_WhenCompleted_SetsIsCompleted()
    {
        var periodKey = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var mission = (MissionId, "daily-login", "Đăng nhập hôm nay", GamificationConstants.EventDailyLogin, 1, 5);

        _missionRepository.Setup(r => r.GetActiveDailyMissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, string, int, int)> { mission });

        _missionProgressRepository.Setup(r => r.GetAsync(
                UserId,
                "daily-login",
                periodKey,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserMissionProgress
            {
                UserId = UserId,
                MissionCode = "daily-login",
                PeriodKey = periodKey,
                ProgressCount = 1,
                CompletedAt = DateTime.UtcNow
            });

        var sut = CreateSut();
        var result = await sut.GetDailyMissionProgressAsync(UserId);

        result.Should().ContainSingle();
        result[0].IsCompleted.Should().BeTrue();
        result[0].Current.Should().Be(1);
    }

    [Fact]
    public async Task GetDailyMissionProgressAsync_WhenNoProgressRow_ReturnsZero()
    {
        var periodKey = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var mission = (MissionId, "daily-ai-1", "Dùng AI 1 lần", GamificationConstants.EventAiUsed, 1, 5);

        _missionRepository.Setup(r => r.GetActiveDailyMissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, string, int, int)> { mission });

        _missionProgressRepository.Setup(r => r.GetAsync(
                UserId,
                "daily-ai-1",
                periodKey,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserMissionProgress?)null);

        var sut = CreateSut();
        var result = await sut.GetDailyMissionProgressAsync(UserId);

        result.Should().ContainSingle();
        result[0].Current.Should().Be(0);
        result[0].IsCompleted.Should().BeFalse();
    }
}
