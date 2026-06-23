using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Gamification;

public sealed class BadgeCheckService : IBadgeCheckService
{
    public const string TriggerPostsPublished = "posts_published";
    public const string TriggerExamsCompleted = "exams_completed";
    public const string TriggerCommentsCreated = "comments_created";
    public const string TriggerStreakDays = "streak_days";
    public const string TriggerPerfectExams = "perfect_exams";
    public const string TriggerHighScoreExams = "high_score_exams";
    public const string TriggerPracticeSubmissions = "practice_submissions";

    private readonly IBadgeRepository _badgeRepository;
    private readonly IUserBadgeRepository _userBadgeRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IExamAttemptRepository _examAttemptRepository;
    private readonly IPracticeSubmissionRepository _practiceSubmissionRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly IProfileSnapshotCache _snapshotCache;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<BadgeCheckService> _logger;

    public BadgeCheckService(
        IBadgeRepository badgeRepository,
        IUserBadgeRepository userBadgeRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        IExamAttemptRepository examAttemptRepository,
        IPracticeSubmissionRepository practiceSubmissionRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        IProfileSnapshotCache snapshotCache,
        IUnitOfWork unitOfWork,
        ILogger<BadgeCheckService> logger)
    {
        _badgeRepository = badgeRepository;
        _userBadgeRepository = userBadgeRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _examAttemptRepository = examAttemptRepository;
        _practiceSubmissionRepository = practiceSubmissionRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _snapshotCache = snapshotCache;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task EvaluateForTriggerAsync(Guid userId, string triggerType, CancellationToken cancellationToken = default)
    {
        try
        {
            var badges = await _badgeRepository.GetAllAsync(cancellationToken);
            var matchingBadges = badges
                .Select(badge => (Badge: badge, Condition: BadgeCondition.TryParse(badge.ConditionJson)))
                .Where(item =>
                    item.Condition is not null &&
                    string.Equals(item.Condition.TriggerType, triggerType, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (matchingBadges.Count == 0)
            {
                return;
            }

            foreach (var (badge, condition) in matchingBadges)
            {
                if (await _userBadgeRepository.ExistsAsync(userId, badge.Id, cancellationToken))
                {
                    continue;
                }

                if (!await MeetsConditionAsync(userId, condition!, cancellationToken))
                {
                    continue;
                }

                var granted = await _userBadgeRepository.TryGrantAsync(userId, badge.Id, cancellationToken);
                if (!granted)
                {
                    continue;
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
                var description = condition!.Description ?? badge.Name;
                await _notificationService.CreateAsync(
                    userId,
                    NotificationType.Badge,
                    $"Danh hiệu mới: {badge.Name}",
                    description,
                    user is null ? null : $"/profile/{user.Username}",
                    referenceId: badge.Id,
                    cancellationToken: cancellationToken);
                _snapshotCache.InvalidateStats(userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Badge evaluation failed for user {UserId} trigger {TriggerType}", userId, triggerType);
        }
    }

    private async Task<bool> MeetsConditionAsync(Guid userId, BadgeCondition condition, CancellationToken cancellationToken)
    {
        var currentValue = condition.TriggerType.ToLowerInvariant() switch
        {
            TriggerPostsPublished => await _postRepository.CountByAuthorIdAsync(userId, cancellationToken),
            TriggerExamsCompleted => await _examAttemptRepository.CountSubmittedByUserIdAsync(userId, cancellationToken),
            TriggerCommentsCreated => await _commentRepository.CountByAuthorIdAsync(userId, cancellationToken),
            TriggerStreakDays => (await _userRepository.GetByIdAsync(userId, cancellationToken))?.StreakCount ?? 0,
            TriggerPerfectExams => await _examAttemptRepository.CountSubmittedWithMinScoreAsync(userId, 100m, cancellationToken),
            TriggerHighScoreExams => await _examAttemptRepository.CountSubmittedWithMinScoreAsync(
                userId,
                condition.MinScore ?? 80,
                cancellationToken),
            TriggerPracticeSubmissions => await _practiceSubmissionRepository.CountByUserIdAsync(userId, cancellationToken),
            _ => 0
        };

        return currentValue >= condition.TriggerValue;
    }
}
