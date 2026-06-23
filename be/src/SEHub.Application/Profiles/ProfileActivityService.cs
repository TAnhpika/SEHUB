using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Profiles;

public sealed class ProfileActivityService : IProfileActivityService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private readonly IUserRepository _userRepository;
    private readonly IUserDailyActivityRepository _activityRepository;
    private readonly IProfileActivityCache _activityCache;
    private readonly ICurrentUserService _currentUser;

    public ProfileActivityService(
        IUserRepository userRepository,
        IUserDailyActivityRepository activityRepository,
        IProfileActivityCache activityCache,
        ICurrentUserService currentUser)
    {
        _userRepository = userRepository;
        _activityRepository = activityRepository;
        _activityCache = activityCache;
        _currentUser = currentUser;
    }

    public async Task<ProfileActivityDto> GetByUsernameAsync(
        string username,
        int months = 6,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }

        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? throw new NotFoundException($"User '{username}' was not found.");

        var safeMonths = Math.Clamp(months, 1, 12);
        var cacheKey = BuildCacheKey(user.Id, safeMonths);
        var cached = await _activityCache.GetAsync<ProfileActivityDto>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var endDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var startDate = endDate.AddMonths(-safeMonths);
        var rows = await _activityRepository.GetRangeAsync(user.Id, startDate, endDate, cancellationToken);
        var countsByDate = rows.ToDictionary(r => r.ActivityDate, r => r.ActivityCount);

        var days = new List<ProfileActivityDayDto>();
        var totalActivities = 0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var count = countsByDate.GetValueOrDefault(date);
            totalActivities += count;
            days.Add(new ProfileActivityDayDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Count = count,
                Level = ToHeatmapLevel(count),
            });
        }

        var result = new ProfileActivityDto
        {
            TotalActivities = totalActivities,
            Days = days,
        };

        await _activityCache.SetAsync(cacheKey, result, CacheTtl, cancellationToken);
        return result;
    }

    internal static string BuildCacheKey(Guid userId, int months) =>
        $"profile-activity:{userId}:{months}";

    public static int ToHeatmapLevel(int count) => count switch
    {
        <= 0 => 0,
        <= 2 => 1,
        <= 5 => 2,
        _ => 3,
    };
}
