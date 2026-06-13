using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Domain.Enums;

namespace SEHub.Application.Profiles;

public sealed class UserActivityService : IUserActivityService
{
    public const int StreakMilestoneDays = 7;
    public const int StreakMilestonePoints = 20;

    private readonly IUserDailyActivityRepository _activityRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IProfileActivityCache _activityCache;
    private readonly IProfileSnapshotCache _snapshotCache;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UserActivityService> _logger;

    public UserActivityService(
        IUserDailyActivityRepository activityRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IProfileActivityCache activityCache,
        IProfileSnapshotCache snapshotCache,
        IUnitOfWork unitOfWork,
        ILogger<UserActivityService> logger)
    {
        _activityRepository = activityRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _activityCache = activityCache;
        _snapshotCache = snapshotCache;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task RecordActivityAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            await _activityRepository.IncrementAsync(userId, today, cancellationToken);

            var streak = await _userRepository.UpdateStreakOnActivityAsync(userId, cancellationToken);
            if (streak.WasIncremented &&
                streak.StreakCount > 0 &&
                streak.StreakCount % StreakMilestoneDays == 0)
            {
                await _userRepository.AddPointsAsync(userId, StreakMilestonePoints, cancellationToken);

                var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
                await _notificationService.CreateAsync(
                    userId,
                    NotificationType.Token,
                    $"Streak {streak.StreakCount} ngày!",
                    $"Bạn nhận +{StreakMilestonePoints} điểm vì duy trì streak {streak.StreakCount} ngày.",
                    user is null ? null : $"/profile/{user.Username}",
                    cancellationToken: cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            _activityCache.InvalidateUser(userId);
            _snapshotCache.InvalidateStats(userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record activity for user {UserId}", userId);
        }
    }
}
