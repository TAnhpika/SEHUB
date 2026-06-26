using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Application.Notifications;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.Gamification.Engines;

public sealed class StreakEngine : IStreakEngine
{
    private readonly IUserRepository _userRepository;
    private readonly IPointEngine _pointEngine;
    private readonly INotificationService _notificationService;
    private readonly IAchievementEngine _achievementEngine;
    private readonly IUnitOfWork _unitOfWork;

    public StreakEngine(
        IUserRepository userRepository,
        IPointEngine pointEngine,
        INotificationService notificationService,
        IAchievementEngine achievementEngine,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _pointEngine = pointEngine;
        _notificationService = notificationService;
        _achievementEngine = achievementEngine;
        _unitOfWork = unitOfWork;
    }

    public async Task<StreakSnapshot> RecordQualifyingActivityAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var streak = await _userRepository.UpdateQualifyingStreakAsync(userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var milestoneReached = streak.WasIncremented &&
            streak.StreakCount > 0 &&
            streak.StreakCount % GamificationConstants.StreakMilestoneDays == 0;

        if (milestoneReached)
        {
            await _pointEngine.AwardByEventTypeAsync(
                userId,
                GamificationConstants.EventStreakMilestone7,
                $"streak.milestone:{userId}:{streak.StreakCount}",
                "streak",
                null,
                cancellationToken);

            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            await _notificationService.CreateAsync(
                userId,
                NotificationType.Token,
                $"Streak {streak.StreakCount} ngày!",
                $"Bạn nhận +{GamificationConstants.StreakMilestonePoints} điểm vì duy trì streak {streak.StreakCount} ngày.",
                user is null ? null : $"/profile/{user.Username}",
                cancellationToken: cancellationToken);

            await _achievementEngine.EvaluateForTriggerAsync(
                userId,
                BadgeCheckService.TriggerStreakDays,
                cancellationToken);
        }

        var account = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return new StreakSnapshot
        {
            CurrentStreak = streak.StreakCount,
            HighestStreak = account?.HighestStreak ?? streak.StreakCount,
            WasIncremented = streak.WasIncremented,
            MilestoneReached = milestoneReached
        };
    }
}
