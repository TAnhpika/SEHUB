using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;

namespace SEHub.Application.Gamification.Engines;

public sealed class HeatmapProjection : IHeatmapProjection
{
    private readonly IUserDailyActivityRepository _activityRepository;

    public HeatmapProjection(IUserDailyActivityRepository activityRepository) =>
        _activityRepository = activityRepository;

    public Task IncrementAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return _activityRepository.IncrementAsync(userId, today, cancellationToken);
    }
}
