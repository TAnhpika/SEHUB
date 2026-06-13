using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserDailyActivityRepository
{
    Task IncrementAsync(Guid userId, DateOnly activityDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserDailyActivity>> GetRangeAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken = default);
}
