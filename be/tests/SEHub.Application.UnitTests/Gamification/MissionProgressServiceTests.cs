using FluentAssertions;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Engines;
using SEHub.Application.Gamification.Models;
using SEHub.Domain.Entities;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Gamification;

public sealed class MissionProgressServiceTests
{
    private readonly Mock<IMissionRepository> _missionRepository = new();
    private readonly Mock<IUserMissionProgressRepository> _missionProgressRepository = new();
    private readonly Mock<IPointEngine> _pointEngine = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid MissionId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private MissionProgressService CreateSut() => new(
        _missionRepository.Object,
        _missionProgressRepository.Object,
        _pointEngine.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task TrackEventAsync_WhenDailyTargetReached_AwardsFixedRewardPoints()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var mission = (MissionId, "daily-comment", "Bình luận 1 lần", GamificationConstants.EventCommentCreated, 1, 3);

        _missionRepository.Setup(r => r.GetActiveDailyMissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, string, int, int)> { mission });
        _missionRepository.Setup(r => r.GetActiveDailyByEventTypeAsync(
                GamificationConstants.EventCommentCreated,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, int, int)>
            {
                (MissionId, "daily-comment", GamificationConstants.EventCommentCreated, 1, 3)
            });
        _missionRepository.Setup(r => r.GetActiveWeeklyByEventTypeAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<(Guid, string, string, int, int)>());

        _missionProgressRepository.Setup(r => r.IncrementAsync(
                UserId,
                "daily-comment",
                today,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserMissionProgress
            {
                UserId = UserId,
                MissionCode = "daily-comment",
                PeriodKey = today,
                ProgressCount = 1,
                CompletedAt = DateTime.UtcNow
            });

        _pointEngine.Setup(e => e.AwardFixedPointsAsync(
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PointAwardResult { Applied = true, Amount = 3 });

        var sut = CreateSut();
        await sut.TrackEventAsync(UserId, GamificationConstants.EventCommentCreated);

        _pointEngine.Verify(
            e => e.AwardFixedPointsAsync(
                UserId,
                3,
                "mission-daily-daily-comment",
                $"daily-mission:daily-comment:{UserId}:{today}",
                "daily_mission",
                MissionId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TrackEventAsync_WhenAlreadyComplete_StillCallsAward_ButPointEngineIsIdempotent()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var mission = (MissionId, "daily-comment", "Bình luận 1 lần", GamificationConstants.EventCommentCreated, 1, 3);

        _missionRepository.Setup(r => r.GetActiveDailyMissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, string, int, int)> { mission });
        _missionRepository.Setup(r => r.GetActiveDailyByEventTypeAsync(
                GamificationConstants.EventCommentCreated,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<(Guid, string, string, int, int)>
            {
                (MissionId, "daily-comment", GamificationConstants.EventCommentCreated, 1, 3)
            });
        _missionRepository.Setup(r => r.GetActiveWeeklyByEventTypeAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<(Guid, string, string, int, int)>());

        _missionProgressRepository.Setup(r => r.IncrementAsync(
                UserId,
                "daily-comment",
                today,
                1,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserMissionProgress
            {
                UserId = UserId,
                MissionCode = "daily-comment",
                PeriodKey = today,
                ProgressCount = 1,
                CompletedAt = DateTime.UtcNow
            });

        _pointEngine.Setup(e => e.AwardFixedPointsAsync(
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PointAwardResult { Applied = false, Amount = 0 });

        var sut = CreateSut();
        await sut.TrackEventAsync(UserId, GamificationConstants.EventCommentCreated);

        _pointEngine.Verify(
            e => e.AwardFixedPointsAsync(
                UserId,
                3,
                "mission-daily-daily-comment",
                $"daily-mission:daily-comment:{UserId}:{today}",
                "daily_mission",
                MissionId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
